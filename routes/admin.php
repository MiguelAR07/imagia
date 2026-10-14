<?php

use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\BrandSettingsController;
use App\Http\Controllers\Admin\Catalog\FaqController;
use App\Http\Controllers\Admin\Catalog\FeatureController;
use App\Http\Controllers\Admin\Catalog\PlanController;
use App\Http\Controllers\Admin\Catalog\ServiceController;
use App\Http\Controllers\Admin\ClientContactController;
use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Admin\ContactSettingsController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\LeadController;
use App\Http\Controllers\Admin\LegalSettingsController;
use App\Http\Controllers\Admin\PipelineStageController;
use App\Http\Controllers\Admin\PortfolioController;
use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\Admin\ProjectPartsController;
use App\Http\Controllers\Admin\QuoteController;
use App\Http\Controllers\Admin\TaskController;
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

            Route::get('configuracion/legal', [LegalSettingsController::class, 'edit'])->name('admin.legal.edit');
            Route::put('configuracion/legal', [LegalSettingsController::class, 'update'])->name('admin.legal.update');
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

        /* Proyectos */
        Route::middleware('permission:proyectos.ver')->group(function () {
            Route::get('proyectos', [ProjectController::class, 'index'])->name('admin.projects.index');
            Route::get('proyectos/{project}', [ProjectController::class, 'show'])->withTrashed()->name('admin.projects.show');
            Route::get('proyectos/{project}/archivos/{file}', [ProjectPartsController::class, 'downloadFile'])
                ->scopeBindings()->name('admin.projects.files.download');
        });

        Route::middleware('permission:proyectos.gestionar')->group(function () {
            Route::post('proyectos', [ProjectController::class, 'store'])->name('admin.projects.store');
            Route::put('proyectos/{project}', [ProjectController::class, 'update'])->name('admin.projects.update');
            Route::patch('proyectos/{project}/estado', [ProjectController::class, 'updateStatus'])->name('admin.projects.status');
            Route::delete('proyectos/{project}', [ProjectController::class, 'destroy'])->name('admin.projects.destroy');
            Route::post('proyectos/{project}/restaurar', [ProjectController::class, 'restore'])->withTrashed()->name('admin.projects.restore');

            Route::scopeBindings()->group(function () {
                Route::post('proyectos/{project}/hitos', [ProjectPartsController::class, 'storeMilestone'])->name('admin.projects.milestones.store');
                Route::put('proyectos/{project}/hitos/{milestone}', [ProjectPartsController::class, 'updateMilestone'])->name('admin.projects.milestones.update');
                Route::delete('proyectos/{project}/hitos/{milestone}', [ProjectPartsController::class, 'destroyMilestone'])->name('admin.projects.milestones.destroy');

                Route::post('proyectos/{project}/entregables', [ProjectPartsController::class, 'storeDeliverable'])->name('admin.projects.deliverables.store');
                Route::put('proyectos/{project}/entregables/{deliverable}', [ProjectPartsController::class, 'updateDeliverable'])->name('admin.projects.deliverables.update');
                Route::delete('proyectos/{project}/entregables/{deliverable}', [ProjectPartsController::class, 'destroyDeliverable'])->name('admin.projects.deliverables.destroy');

                Route::post('proyectos/{project}/archivos', [ProjectPartsController::class, 'storeFile'])
                    ->middleware('throttle:30,1')->name('admin.projects.files.store');
                Route::delete('proyectos/{project}/archivos/{file}', [ProjectPartsController::class, 'destroyFile'])->name('admin.projects.files.destroy');
            });
        });

        /* Tareas */
        Route::middleware('permission:tareas.gestionar')->group(function () {
            Route::get('tareas', [TaskController::class, 'index'])->name('admin.tasks.index');
            Route::post('tareas', [TaskController::class, 'store'])->name('admin.tasks.store');
            Route::get('tareas/{task}', [TaskController::class, 'show'])->name('admin.tasks.show');
            Route::put('tareas/{task}', [TaskController::class, 'update'])->name('admin.tasks.update');
            Route::patch('tareas/{task}/estado', [TaskController::class, 'updateStatus'])->name('admin.tasks.status');
            Route::delete('tareas/{task}', [TaskController::class, 'destroy'])->name('admin.tasks.destroy');
            Route::post('tareas/{task}/comentarios', [TaskController::class, 'storeComment'])->name('admin.tasks.comments.store');
            Route::delete('comentarios/{comment}', [TaskController::class, 'destroyComment'])->name('admin.tasks.comments.destroy');
        });

        /* Catálogo: servicios, planes, funcionalidades y preguntas frecuentes */
        Route::middleware('permission:catalogo.gestionar')->prefix('catalogo')->name('admin.catalog.')->group(function () {
            Route::get('/', fn () => to_route('admin.catalog.services.index'))->name('home');

            Route::get('servicios', [ServiceController::class, 'index'])->name('services.index');
            Route::post('servicios', [ServiceController::class, 'store'])->name('services.store');
            Route::put('servicios/orden', [ServiceController::class, 'reorder'])->name('services.reorder');
            Route::put('servicios/{service}', [ServiceController::class, 'update'])->name('services.update');
            Route::delete('servicios/{service}', [ServiceController::class, 'destroy'])->name('services.destroy');

            Route::get('planes', [PlanController::class, 'index'])->name('plans.index');
            Route::get('planes/nuevo', [PlanController::class, 'create'])->name('plans.create');
            Route::post('planes', [PlanController::class, 'store'])->name('plans.store');
            Route::put('planes/orden', [PlanController::class, 'reorder'])->name('plans.reorder');
            Route::get('planes/{plan}', [PlanController::class, 'edit'])->name('plans.edit');
            Route::put('planes/{plan}', [PlanController::class, 'update'])->name('plans.update');
            Route::delete('planes/{plan}', [PlanController::class, 'destroy'])->name('plans.destroy');

            Route::get('funcionalidades', [FeatureController::class, 'index'])->name('features.index');
            Route::post('funcionalidades', [FeatureController::class, 'store'])->name('features.store');
            Route::put('funcionalidades/{feature}', [FeatureController::class, 'update'])->name('features.update');
            Route::delete('funcionalidades/{feature}', [FeatureController::class, 'destroy'])->name('features.destroy');

            Route::get('preguntas', [FaqController::class, 'index'])->name('faqs.index');
            Route::post('preguntas', [FaqController::class, 'store'])->name('faqs.store');
            Route::put('preguntas/orden', [FaqController::class, 'reorder'])->name('faqs.reorder');
            Route::put('preguntas/{faq}', [FaqController::class, 'update'])->name('faqs.update');
            Route::delete('preguntas/{faq}', [FaqController::class, 'destroy'])->name('faqs.destroy');
        });

        /* Cotizaciones */
        Route::middleware('permission:cotizaciones.gestionar')->prefix('cotizaciones')->name('admin.quotes.')->group(function () {
            Route::get('/', [QuoteController::class, 'index'])->name('index');
            Route::get('nueva', [QuoteController::class, 'create'])->name('create');
            Route::post('/', [QuoteController::class, 'store'])->name('store');
            Route::post('impuestos', [QuoteController::class, 'storeTaxRate'])->name('taxes.store');
            Route::put('impuestos/{taxRate}', [QuoteController::class, 'updateTaxRate'])->name('taxes.update');
            Route::delete('impuestos/{taxRate}', [QuoteController::class, 'destroyTaxRate'])->name('taxes.destroy');
            Route::get('{quote}', [QuoteController::class, 'show'])->name('show');
            Route::get('{quote}/editar', [QuoteController::class, 'edit'])->name('edit');
            Route::get('{quote}/imprimir', [QuoteController::class, 'print'])->name('print');
            Route::put('{quote}', [QuoteController::class, 'update'])->name('update');
            Route::patch('{quote}/estado', [QuoteController::class, 'updateStatus'])->name('status');
            Route::post('{quote}/duplicar', [QuoteController::class, 'duplicate'])->name('duplicate');
            Route::post('{quote}/proyecto', [QuoteController::class, 'createProject'])
                ->middleware('permission:proyectos.gestionar')->name('project');
            Route::delete('{quote}', [QuoteController::class, 'destroy'])->name('destroy');
        });

        /* Portafolio */
        Route::middleware('permission:catalogo.gestionar')->prefix('portafolio')->name('admin.portfolio.')->group(function () {
            Route::get('/', [PortfolioController::class, 'index'])->name('index');
            Route::get('nuevo', [PortfolioController::class, 'create'])->name('create');
            Route::post('/', [PortfolioController::class, 'store'])->name('store');
            Route::get('{item}', [PortfolioController::class, 'edit'])->name('edit');
            Route::put('{item}', [PortfolioController::class, 'update'])->name('update');
            Route::patch('{item}/publicacion', [PortfolioController::class, 'publish'])->name('publish');
            Route::post('{item}/duplicar', [PortfolioController::class, 'duplicate'])->name('duplicate');
            Route::delete('{item}', [PortfolioController::class, 'destroy'])->name('destroy');
            Route::post('{item}/restaurar', [PortfolioController::class, 'restore'])->withTrashed()->name('restore');
            Route::post('{item}/portada', [PortfolioController::class, 'uploadCover'])->middleware('throttle:30,1')->name('cover');
            Route::post('{item}/imagenes', [PortfolioController::class, 'uploadImages'])->middleware('throttle:30,1')->name('images.store');
            Route::delete('{item}/imagenes/{image}', [PortfolioController::class, 'destroyImage'])->scopeBindings()->name('images.destroy');
        });

        /* Historial: notas e interacciones (el permiso depende del registro) */
        Route::post('{subjectType}/{subjectId}/actividades', [ActivityController::class, 'store'])
            ->whereIn('subjectType', ['clientes', 'prospectos', 'proyectos'])
            ->whereNumber('subjectId')
            ->name('admin.activities.store');
        Route::delete('actividades/{activity}', [ActivityController::class, 'destroy'])->name('admin.activities.destroy');
    });
