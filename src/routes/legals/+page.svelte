<script>
    import { _ } from '$lib/i18n';
</script>

<svelte:head>
    <title>{$_('legals.title')} - Kaissa</title>
</svelte:head>

<section class="flex flex-col gap-8 p-8 lg:p-16 items-center w-full">
    <div class="flex flex-col items-center mb-8">
        <img alt="Kaissa" class="w-64" src="/kaissa-logo.png"/>
        <p class="text-2xl">{$_('legals.tagline')}</p>
    </div>
    <h1 class="h1">{$_('legals.title')}</h1>

    <div class="w-2/3">

        <h2 class="text-2xl mt-8">{$_('legals.sections.editor.title')}</h2>

        <dl class="flex flex-col gap-2">
            <div class="flex gap-2">
                <dt>{$_('legals.sections.editor.companyName')}</dt>
                <dd>{$_('legals.sections.editor.companyNameValue')}</dd>
            </div>

            <div class="flex gap-2">
                <dt>{$_('legals.sections.editor.legalForm')}</dt>
                <dd>{$_('legals.sections.editor.legalFormValue')}</dd>
            </div>

            <div class="flex gap-2">
                <dt>{$_('legals.sections.editor.capital')}</dt>
                <dd>{$_('legals.sections.editor.capitalValue')}</dd>
            </div>

            <div class="flex gap-2">
                <dt>{$_('legals.sections.editor.headquarters')}</dt>
                <dd>{$_('legals.sections.editor.headquartersValue')}</dd>
            </div>

            <div class="flex gap-2">
                <dt>{$_('legals.sections.editor.registrationNumber')}</dt>
                <dd>{$_('legals.sections.editor.registrationNumberValue')}</dd>
            </div>

            <div class="flex gap-2">
                <dt>{$_('legals.sections.editor.vat')}</dt>
                <dd>{$_('legals.sections.editor.vatValue')}</dd>
            </div>

            <div class="flex gap-2">
                <dt>{$_('legals.sections.editor.email')}</dt>
                <dd class="text-primary-500 underline"><a href="mailto:contact@pionics.fr">contact@pionics.fr</a></dd>
            </div>

            <div class="flex gap-2">
                <dt>{$_('legals.sections.editor.director')}</dt>
                <dd>{$_('legals.sections.editor.directorValue')}</dd>
            </div>
        </dl>

        <h2 class="text-2xl mt-8">{$_('legals.sections.hosting.title')}</h2>

        <dl class="flex flex-col gap-2">
            <div class="flex gap-2">
                <dt>{$_('legals.sections.hosting.name')}</dt>
                <dd>{$_('legals.sections.hosting.nameValue')}</dd>
            </div>
        </dl>

        <h2 class="text-2xl mt-8">{$_('legals.sections.intellectualProperty.title')}</h2>

        <p>{$_('legals.sections.intellectualProperty.content')}</p>

        <h2 class="text-2xl mt-8">{$_('legals.sections.gdpr.title')}</h2>

        <p>{$_('legals.sections.gdpr.content')}<a class="text-primary-500 underline"
                                                    href="mailto:rgpd@pionics.fr">rgpd@pionics.fr</a>.
        </p>

        <h2 class="text-2xl mt-8">{$_('legals.sections.cookies.title')}</h2>

        <p>{$_('legals.sections.cookies.content')}</p>

        <h2 class="text-2xl mt-8">{$_('legals.sections.liability.title')}</h2>

        <p>{$_('legals.sections.liability.content')}</p>

        <h2 class="text-2xl mt-8">{$_('legals.sections.law.title')}</h2>

        <p>{$_('legals.sections.law.content')}</p>

    </div>
</section>
