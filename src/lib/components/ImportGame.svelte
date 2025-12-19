<script>
    import {Dialog, FileUpload, Portal} from "@skeletonlabs/skeleton-svelte";
    import {FileIcon, XIcon} from "@lucide/svelte";

    const animation =
        'transition transition-discrete opacity-0 translate-y-[100px] starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-y-[100px] data-[state=open]:opacity-100 data-[state=open]:translate-y-0';
</script>

<Dialog>
    <Dialog.Trigger class="btn preset-filled">Importer une partie</Dialog.Trigger>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50"/>
        <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
            <Dialog.Content
                    class="card bg-surface-100-900 w-full max-w-xl p-4 space-y-4 shadow-xl {animation}">
                <header class="flex justify-between items-center">
                    <Dialog.Title class="text-lg font-bold">Importez vos parties</Dialog.Title>
                    <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
                        <XIcon class="size-4"/>
                    </Dialog.CloseTrigger>
                </header>

                <FileUpload>
                    <FileUpload.Label>Téléversez vos fichiers</FileUpload.Label>
                    <FileUpload.Dropzone>
                        <FileIcon class="size-10"/>
                        <span>Selectionnez un fichier ou déplacez-le ici.</span>
                        <FileUpload.Trigger>Rechercher des fichiers</FileUpload.Trigger>
                        <FileUpload.HiddenInput/>
                    </FileUpload.Dropzone>
                    <FileUpload.ItemGroup>
                        <FileUpload.Context>
                            {#snippet children(fileUpload)}
                                {#each fileUpload().acceptedFiles as file (file.name)}
                                    <FileUpload.Item {file}>
                                        <FileUpload.ItemName>{file.name}</FileUpload.ItemName>
                                        <FileUpload.ItemSizeText>{file.size} bytes</FileUpload.ItemSizeText>
                                        <FileUpload.ItemDeleteTrigger/>
                                    </FileUpload.Item>
                                {/each}
                            {/snippet}
                        </FileUpload.Context>
                    </FileUpload.ItemGroup>
                    <FileUpload.ClearTrigger>Clear Files</FileUpload.ClearTrigger>
                </FileUpload>
                <footer class="flex justify-end gap-2">
                    <Dialog.CloseTrigger class="btn preset-tonal">Cancel</Dialog.CloseTrigger>
                    <button class="btn preset-filled" type="button">Save</button>
                </footer>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>