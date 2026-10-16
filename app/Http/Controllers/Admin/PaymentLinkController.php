<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentLink;
use App\Models\Project;
use App\Notifications\PaymentLinkForClient;
use App\Payments\Wompi;
use App\Support\ClientMail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Links de pago en línea (Wompi) que se envían al cliente de un proyecto.
 */
class PaymentLinkController extends Controller
{
    public function store(Request $request, Project $project): RedirectResponse
    {
        if (! Wompi::configured()) {
            throw ValidationException::withMessages(['amount' => 'Primero configura las llaves de Wompi en el archivo .env.']);
        }

        if ($project->currency !== 'COP') {
            throw ValidationException::withMessages(['amount' => 'Los pagos con Wompi solo se reciben en pesos colombianos (COP).']);
        }

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:1500', 'max:999999999'],
            'description' => ['required', 'string', 'max:120'],
            'kind' => ['nullable', 'in:balance,other'],
            'send_email' => ['boolean'],
        ], [
            'amount.min' => 'El valor mínimo para cobrar en línea es $1.500.',
        ]);

        $pending = $project->finance()['pending'];
        if ($pending !== null && (float) $data['amount'] > $pending + 0.001) {
            throw ValidationException::withMessages([
                'amount' => 'El valor supera lo que falta por cobrar ($'.number_format($pending, 0, ',', '.').' COP).',
            ]);
        }

        $link = new PaymentLink(['amount' => round((float) $data['amount']), 'description' => $data['description']]);
        $link->forceFill(['project_id' => $project->id, 'kind' => $data['kind'] ?? 'other', 'currency' => 'COP', 'created_by' => $request->user()->id])->save();

        $project->logActivity('system', 'Link de pago creado por $'.number_format((float) $link->amount, 0, ',', '.')." COP · {$link->description}.");

        $sent = ($data['send_email'] ?? false) ? $this->sendToClient($link) : null;

        Inertia::flash('toast', match (true) {
            $sent === null => ['type' => 'success', 'message' => 'Link de pago creado. Cópialo y envíaselo al cliente.'],
            $sent === false => ['type' => 'error', 'message' => 'Link creado, pero no se pudo enviar el correo. Cópialo y envíalo por WhatsApp.'],
            default => ['type' => 'success', 'message' => "Link de pago creado y enviado a {$sent}."],
        });

        return back();
    }

    /** Envía (o reenvía) el link por correo al cliente del proyecto. */
    public function email(PaymentLink $paymentLink): RedirectResponse
    {
        abort_if($paymentLink->status !== 'pending' || $paymentLink->project_id === null, 422, 'Solo se envían links pendientes.');

        $sent = $this->sendToClient($paymentLink);

        if ($sent === null) {
            throw ValidationException::withMessages(['email' => 'El cliente no tiene correo registrado.']);
        }

        Inertia::flash('toast', $sent === false
            ? ['type' => 'error', 'message' => 'No se pudo enviar el correo. Revisa la configuración de correo.']
            : ['type' => 'success', 'message' => "Link enviado a {$sent}."]);

        return back();
    }

    /**
     * @return string|false|null El correo al que se envió, false si falló el envío o null si el cliente no tiene correo
     */
    private function sendToClient(PaymentLink $link): string|false|null
    {
        $link->load('project.client:id,name,email');
        $email = $link->project?->client?->email;

        if (! $email) {
            return null;
        }

        if (! ClientMail::send($email, new PaymentLinkForClient($link))) {
            return false;
        }

        $link->project->logActivity('system', "Link de pago «{$link->description}» enviado por correo a {$email}.");

        return $email;
    }

    public function cancel(PaymentLink $paymentLink): RedirectResponse
    {
        abort_if($paymentLink->status !== 'pending', 422, 'Solo se anulan links pendientes.');

        $paymentLink->forceFill(['status' => 'cancelled'])->save();
        $paymentLink->project->logActivity('system', "Link de pago anulado: {$paymentLink->description}.");
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Link de pago anulado.']);

        return back();
    }
}
