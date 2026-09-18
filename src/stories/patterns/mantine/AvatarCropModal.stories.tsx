import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { AvatarCropModal } from '@/components/shared/AvatarCropModal';
import { MantineStoryShell } from '../../mantine/_MantineStoryShell';

/**
 * Task 842 — standalone canonical Story for the real production `AvatarCropModal`. Direct import
 * of the shared component (not a design-system pattern wrapper); no mock is used anywhere in this
 * file. Fixture choices, both documented so the owner can tell fixture from production behaviour:
 * `imageSrc="/og-default.png"` — a same-origin `public/` asset served by Storybook's `staticDirs`
 * (`.storybook/main.ts`), so `Cropper`'s canvas is never tainted. `onConfirm` returns a Promise that
 * never resolves, so pressing Save leaves the real `saving` state on indefinitely (loader on Save,
 * Cancel disabled, close/Esc/backdrop ignored) for the owner to review — the component's own
 * `handleSave`/`cropImageToBlob` code path runs unmodified up to that await.
 */
const meta: Meta<typeof AvatarCropModal> = {
  title: 'Patterns/Mantine/AvatarCropModal',
  component: AvatarCropModal,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Task 842 — the real production AvatarCropModal (MantineModal + Slider + Cropper), opened. Viewport and locale switched via the Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof AvatarCropModal>;

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en';

    return (
      <MantineStoryShell>
        <AvatarCropModal
          imageSrc="/og-default.png"
          title={storyT(locale, 'cabinet.avatar_crop_title')}
          hint={storyT(locale, 'cabinet.avatar_crop_hint')}
          zoomLabel={storyT(locale, 'cabinet.avatar_zoom_label')}
          cancelLabel={storyT(locale, 'common.cancel')}
          saveLabel={storyT(locale, 'common.save')}
          onConfirm={() => new Promise<void>(() => {})}
          onCancel={() => {}}
        />
      </MantineStoryShell>
    );
  },
};
