<?php

namespace App\Providers;

use Anthropic\Client as AnthropicClient;
use App\Assistant\AiEngine;
use App\Models\ChatSession;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Plan;
use App\Models\Project;
use App\Models\Service;
use App\Models\User;
use App\Support\Permissions;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Cliente de Claude para el asistente. La clave sale de .env y nunca llega al navegador.
        $this->app->bind(AiEngine::class, fn () => new AiEngine(
            new AnthropicClient(
                apiKey: (string) config('services.anthropic.key'),
                requestOptions: ['timeout' => config('services.anthropic.timeout'), 'maxRetries' => 1],
            ),
            (string) config('services.anthropic.model'),
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        // Nombres cortos y estables para las relaciones polimórficas (historial, archivos, FAQ).
        Relation::morphMap([
            'client' => Client::class,
            'lead' => Lead::class,
            'project' => Project::class,
            'plan' => Plan::class,
            'service' => Service::class,
            'chat_session' => ChatSession::class,
        ]);

        // Asistente del sitio: mensajes por minuto y conversaciones nuevas por hora, por IP.
        RateLimiter::for('assistant', fn (Request $request) => Limit::perMinute(20)->by($request->ip()));
        RateLimiter::for('assistant-start', fn (Request $request) => Limit::perHour(10)->by($request->ip()));

        // El administrador puede hacer todo; el resto depende de sus permisos.
        Gate::before(fn (User $user) => $user->hasRole(Permissions::ROLE_ADMIN) ? true : null);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
