<?php

use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\BrandSettingsController;
use App\Http\Controllers\Admin\ClientContactController;
use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Admin\ContactSettingsController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\LeadController;
use App\Http\Controllers\Admin\PipelineStageController;
use App\Http\Controllers\Admin\UserController;
use App\Support\Permissions;
use Illuminate\Support\Facades\Route;

/*
| Panel privado. Toda ruta exige sesión, correo verificado y permiso de acceso al panel.
*/
Route::middleware(['auth', 'verified', 'permission:'.Permissions::PANEL_ACCESS])
    ->prefix('admin')
    ->group(function () {
        Route::get('/', DashboardController::class)->name('dashboard');

        Route::middleware('permission:'.Permissions::MANAGE_BRAND)->group(function () {
            Route::get('configuracion', fn () => to_route('admin.brand.edit'))->name('admin.settings');

            Route::get('configuracion/marca', [BrandSettingsController::class, 'edit'])->name('admin.brand.edit');
            Route::put('configuracion/marca', [BrandSettingsController::class, 'update'])->name('admin.brand.update');

            Route::get('configuracion/contacto', [ContactSettingsController::class, 'edit'])->name('admin.contact.edit');
            Route::put('configuracion/contacto', [ContactSettingsController::class, 'update'])->name('admin.contact.update');
        });

        Route::middleware('permission:'.Permissions::MANAGE_USERS)->group(function () {
            Route::get('usuarios', [UserController::class, 'index'])->name('admin.users.index');
            Route::post('usuarios', [UserController::class, 'store'])
                ->middleware('throttle:10,1')
                ->name('admin.users.store');
            Route::put('usuarios/{user}', [UserController::class, 'update'])->name('admin.users.update');
            Route::post('usuarios/{user}/invitacion', [UserController::class, 'resendInvitation'])
                ->middleware('throttle:6,1')
                ->name('admin.users.invite');
        });

        /* Clientes */
        Route::middleware('permission:clientes.ver')->group(function () {
            Route::get('clientes', [ClientController::class, 'index'])->name('admin.clients.index');
            Route::get('clientes/{client}', [ClientController::class, 'show'])->withTrashed()->name('admin.clients.show');
        });

        Route::middleware('permission:clientes.gestionar')->group(function () {
            Route::post('clientes', [ClientController::class, 'store'])->name('admin.clients.store');
            Route::put('clientes/{client}', [ClientController::class, 'update'])->name('admin.clients.update');
            Route::delete('clientes/{client}', [ClientController::class, 'destroy'])->name('admin.clients.destroy');
            Route::post('clientes/{client}/restaurar', [ClientController::class, 'restore'])->withTrashed()->name('admin.clients.restore');

            Route::scopeBindings()->group(function () {
                Route::post('clientes/{client}/contactos', [ClientContactController::class, 'store'])->name('admin.clients.contacts.store');
                Route::put('clientes/{client}/contactos/{contact}', [ClientContactController::class, 'update'])->name('admin.clients.contacts.update');
                Route::delete('clientes/{client}/contactos/{contact}', [ClientContactController::class, 'destroy'])->name('admin.clients.contacts.destroy');
            });
        });

        /* Prospectos y embudo comercial */
        Route::middleware('permission:prospectos.gestionar')->group(function () {
            Route::get('prospectos', [LeadController::class, 'index'])->name('admin.leads.index');
            Route::post('prospectos', [LeadController::class, 'store'])->name('admin.leads.store');
            Route::get('prospectos/{lead}', [LeadController::class, 'show'])->withTrashed()->name('admin.leads.show');
            Route::put('prospectos/{lead}', [LeadController::class, 'update'])->name('admin.leads.update');
            Route::patch('prospectos/{lead}/etapa', [LeadController::class, 'move'])->name('admin.leads.move');
            Route::delete('prospectos/{lead}', [LeadController::class, 'destroy'])->name('admin.leads.destroy');
        });

        Route::post('prospectos/{lead}/convertir', [LeadController::class, 'convert'])
            ->middleware(['permission:prospectos.gestionar', 'permission:clientes.gestionar'])
            ->name('admin.leads.convert');

        Route::middleware('permission:'.Permissions::MANAGE_BRAND)->group(function () {
            Route::post('embudo/etapas', [PipelineStageController::class, 'store'])->name('admin.stages.store');
            Route::put('embudo/etapas/orden', [PipelineStageController::class, 'reorder'])->name('admin.stages.reorder');
            Route::put('embudo/etapas/{stage}', [PipelineStageController::class, 'update'])->name('admin.stages.update');
            Route::delete('embudo/etapas/{stage}', [PipelineStageController::class, 'destroy'])->name('admin.stages.destroy');
        });

        /* Historial: notas e interacciones (el permiso depende del registro) */
        Route::post('{subjectType}/{subjectId}/actividades', [ActivityController::class, 'store'])
            ->whereIn('subjectType', ['clientes', 'prospectos'])
            ->whereNumber('subjectId')
            ->name('admin.activities.store');
        Route::delete('actividades/{activity}', [ActivityController::class, 'destroy'])->name('admin.activities.destroy');
    });
