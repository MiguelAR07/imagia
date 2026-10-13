<?php

namespace App\Providers;

use App\Models\Client;
use App\Models\Lead;
use App\Models\Plan;
use App\Models\Project;
use App\Models\Service;
use App\Models\User;
use App\Support\Permissions;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
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
        ]);

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
