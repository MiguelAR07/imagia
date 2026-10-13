<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Permissions;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

class CreateAdmin extends Command
{
    protected $signature = 'imagia:admin
                            {--name= : Nombre completo}
                            {--email= : Correo con el que iniciará sesión}
                            {--generar-clave : Genera una contraseña temporal en vez de preguntarla}';

    protected $description = 'Crea (o convierte en administrador) la cuenta con acceso total al panel';

    public function handle(): int
    {
        $this->callSilently('db:seed', ['--class' => RolesAndPermissionsSeeder::class, '--force' => true]);

        $name = $this->option('name') ?: text('Nombre completo', required: true);
        $email = strtolower((string) ($this->option('email') ?: text('Correo', required: true)));

        $validator = Validator::make(['email' => $email], ['email' => ['required', 'email']]);

        if ($validator->fails()) {
            $this->components->error($validator->errors()->first('email'));

            return self::FAILURE;
        }

        $existing = User::query()->where('email', $email)->first();

        if ($existing !== null) {
            $existing->assignRole(Permissions::ROLE_ADMIN);
            $existing->forceFill(['is_active' => true])->save();
            $this->components->info("{$email} ya existía y ahora es administrador.");

            return self::SUCCESS;
        }

        // Con --generar-clave no se hace ninguna pregunta: útil en terminales donde
        // la entrada oculta de contraseñas no funciona bien (algunas de Windows).
        $generated = (bool) $this->option('generar-clave');
        $plain = $generated
            ? Str::password(16, symbols: false)
            : password(
                'Contraseña (mínimo 12 caracteres)',
                required: true,
                validate: fn (string $value) => Validator::make(
                    ['password' => $value],
                    ['password' => Password::min(12)->letters()->numbers()],
                )->errors()->first('password') ?: null,
            );

        $user = User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $plain,
            'is_active' => true,
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();
        $user->assignRole(Permissions::ROLE_ADMIN);

        $this->components->info('Administrador creado. Inicia sesión en '.url('/login')." con {$email}.");

        if ($generated) {
            $this->components->twoColumnDetail('Contraseña temporal', $plain);
            $this->components->warn('Se muestra solo esta vez. Cámbiala en Mi cuenta → Seguridad al entrar.');
        }

        return self::SUCCESS;
    }
}
