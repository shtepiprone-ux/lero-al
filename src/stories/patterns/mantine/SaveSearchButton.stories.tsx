import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { within, userEvent } from 'storybook/test';
import { SaveSearchButton } from '@/modules/listings/components/SaveSearchButton';
import { MantineStoryShell } from '../../mantine/_MantineStoryShell';
import enMessages from '../../../../messages/en.json';
import sqMessages from '../../../../messages/sq.json';
import ukMessages from '../../../../messages/uk.json';
import itMessages from '../../../../messages/it.json';

/**
 * Task 782 (F3) — standalone canonical Story for the real production `SaveSearchButton`. Was
 * missing entirely before this task: the component only ever appeared through the
 * `ListingsShellView`/`ListingsActionRow` composition stories, which proved integration but never
 * exercised the modal's own open/pending states in isolation (agent-contract clause 16c /
 * `create-task/SKILL.md` story-first gate — a required cell for an in-scope production consumer,
 * not an optional independent artifact).
 *
 * `SaveSearchButton` owns all its state internally (no `open`/`isPending` props) — `OpenModal` and
 * `Pending` are reached via a Storybook `play` function clicking the real trigger/submit controls,
 * the same technique `AuthSheet.stories.tsx`'s `LoginValidationError` story already uses. The
 * `Pending` cell's `play` function clicks Save and returns WITHOUT awaiting `saveSavedSearch`'s own
 * resolution — React flips `isPending` synchronously when `startTransition`'s callback starts
 * (before any `await` inside it settles), so the Loader/disabled state is genuinely present at
 * capture time regardless of how the underlying (real, unmocked) server action ultimately settles
 * in this static environment.
 */
const SAVED_SEARCH_MESSAGES: Record<string, { saved_search: Record<string, string> }> = {
  en: enMessages as never,
  sq: sqMessages as never,
  uk: ukMessages as never,
  it: itMessages as never,
};

function ssT(locale: string, key: string): string {
  return SAVED_SEARCH_MESSAGES[locale]?.saved_search?.[key] ?? SAVED_SEARCH_MESSAGES.en.saved_search[key];
}

const meta: Meta<typeof SaveSearchButton> = {
  title: 'Patterns/Mantine/SaveSearchButton',
  component: SaveSearchButton,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: {
      navigation: {
        pathname: '/listings',
        query: { type: 'sale', property_type: 'apartment' },
      },
    },
    docs: {
      description: {
        component: 'Task 782 — the real production SaveSearchButton (trigger + MantineModal), with dedicated open-modal and pending-save cells. Viewport and locale switched via the Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof SaveSearchButton>;

export const Default: Story = {
  render: () => (
    <MantineStoryShell>
      <SaveSearchButton />
    </MantineStoryShell>
  ),
};

export const OpenModal: Story = {
  render: () => (
    <MantineStoryShell>
      <SaveSearchButton />
    </MantineStoryShell>
  ),
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en';
    const doc = canvasElement.ownerDocument;
    const canvas = within(doc.body);
    const trigger = await canvas.findByRole('button', { name: ssT(locale, 'save_action') });
    await userEvent.click(trigger);
    // Modal content (name TextInput) confirms the open state before the screenshot is taken.
    await canvas.findByPlaceholderText(ssT(locale, 'name_placeholder'), {}, { timeout: 4000 });
  },
};

export const Pending: Story = {
  render: () => (
    <MantineStoryShell>
      <SaveSearchButton />
    </MantineStoryShell>
  ),
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en';
    const doc = canvasElement.ownerDocument;
    const canvas = within(doc.body);
    const trigger = await canvas.findByRole('button', { name: ssT(locale, 'save_action') });
    await userEvent.click(trigger);
    const saveButton = await canvas.findByRole('button', { name: ssT(locale, 'save') });
    // Deliberately not awaited past the click — see the component doc comment above: isPending
    // flips synchronously when the transition starts, so the Loader is present immediately.
    await userEvent.click(saveButton);
  },
};
