import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SimpleGrid, Image } from '@mantine/core';
import { BedDouble, Bath, Maximize2, Heart, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storyT } from '@/stories/_storyI18n';
import { MantineListingCardPattern, type MantineListingCardBadge, type MantineListingCardOverlay } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineListingCardPattern> = {
  title: 'Patterns/Mantine/ListingCardPattern',
  component: MantineListingCardPattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Complete listing card (Task 605) — single source of truth for the real ListingCard vertical branch: photo, badges, sold/rented overlay, photo counter, favorite, type/title/location, features, price(+old), footer. Grid cols adapt via SimpleGrid responsive cols. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineListingCardPattern>;

const DEMO_IMAGE_URL = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop';

// Demo photo element — a plain <img>, standing in for the real app's `AppImage`. The pattern's
// `.imageSection img` tag-selector hover-zoom targets this the same way it targets AppImage's
// inner <img> (Task 602 CSS-cascade note).
function DemoImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    // Explicit height — this fallback has no intrinsic size of its own (unlike the real
    // `AppImage`, whose container class reserves frame height to avoid CLS even with no photo).
    return (
      <div className="h-[180px] flex items-center justify-center bg-muted">
        <Maximize2 className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }
  return <Image src={src} alt={alt} h={180} fit="cover" />;
}

// Demo favorite heart — visual stand-in for the real `FavoriteButton`, built on the same
// canonical `Button` primitive (`icon-sm` size, Task 603 fix) so the story genuinely represents
// production chrome. Self-positions via `absolute top-2 right-2` (the contract the pattern
// expects from the `favorite` node).
function DemoFavoriteButton({ locale, favorited = false }: { locale: string; favorited?: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={favorited ? storyT(locale, 'storybook.mantine.card_favorite_aria_remove') : storyT(locale, 'storybook.mantine.card_favorite_aria_add')}
      aria-pressed={favorited}
      className={
        'absolute top-2 right-2 shadow-sm rounded-full w-8 h-8 p-0 ' +
        (favorited ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-card/80 text-foreground hover:bg-card hover:text-destructive')
      }
    >
      <Heart className="h-4 w-4" fill={favorited ? 'currentColor' : 'none'} />
    </Button>
  );
}

// Demo footer actions — copy-id + date cluster, visual stand-in for the real container's
// stateful copy-id button.
function DemoFooterActions({ locale, id }: { locale: string; id: string }) {
  return (
    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
      <span className="font-mono text-2xs text-muted-foreground/70 inline-flex items-center gap-0.5">
        #{id}
        <Copy className="h-2.5 w-2.5 shrink-0 opacity-50" />
      </span>
      <span className="whitespace-nowrap">{storyT(locale, 'storybook.mantine.card_footer_date')}</span>
    </div>
  );
}

function demoFeatures(l: string) {
  return [
    { icon: <BedDouble className="h-3.5 w-3.5" />, value: storyT(l, 'storybook.mantine.listing_feature_rooms') },
    { icon: <Bath className="h-3.5 w-3.5" />, value: storyT(l, 'storybook.mantine.listing_feature_floor') },
    { icon: <Maximize2 className="h-3.5 w-3.5" />, value: storyT(l, 'storybook.mantine.listing_feature_area') },
  ];
}

interface DemoCardOpts {
  l: string
  id: string
  reduced?: boolean
  premium?: boolean
  archived?: boolean
  sold?: boolean
  noImage?: boolean
  favorited?: boolean
  photoCount?: number
}

function DemoCard({ l, id, reduced = false, premium = false, archived = false, sold = false, noImage = false, favorited = false, photoCount = 5 }: DemoCardOpts) {
  const badges: MantineListingCardBadge[] = [];
  if (!sold && !archived) {
    badges.push({
      label: reduced ? storyT(l, 'storybook.mantine.card_badge_reduced') : storyT(l, 'storybook.mantine.card_badge_new'),
      variant: 'default',
      className: reduced ? 'bg-badge-reduced text-primary-foreground' : 'bg-badge-new text-primary-foreground',
    });
  }
  if (sold) {
    badges.push({ label: storyT(l, 'storybook.mantine.card_overlay_sold'), variant: 'default', className: 'bg-status-info text-primary-foreground' });
  }
  if (archived) {
    badges.push({ label: storyT(l, 'storybook.mantine.card_badge_archived'), variant: 'outline', className: 'border-border text-muted-foreground' });
  }

  const overlay: MantineListingCardOverlay | undefined = sold
    ? { label: storyT(l, 'storybook.mantine.card_overlay_sold'), className: 'bg-status-info/80 border-status-info' }
    : undefined;

  return (
    <MantineListingCardPattern
      data={{
        id,
        title: storyT(l, 'storybook.mantine.card_title_1'),
        location: storyT(l, 'storybook.mantine.card_location_tirana'),
        price: storyT(l, 'storybook.mantine.card_price_1'),
        priceOld: reduced ? storyT(l, 'storybook.mantine.card_price_old_1') : undefined,
      }}
      image={<DemoImage src={noImage ? undefined : DEMO_IMAGE_URL} alt={storyT(l, 'storybook.mantine.card_title_1')} />}
      favorite={<DemoFavoriteButton locale={l} favorited={favorited} />}
      typeLabel={storyT(l, 'storybook.mantine.card_type_label')}
      badges={badges}
      overlay={overlay}
      photoCount={noImage ? 0 : photoCount}
      features={demoFeatures(l)}
      pricePerSqmStr={storyT(l, 'storybook.mantine.card_price_per_sqm_1')}
      footerActions={<DemoFooterActions locale={l} id={id} />}
      isPremium={premium}
      isArchived={archived}
    />
  );
}

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} p="md">
        {/* Regular listing — favorite (unfavorited), new badge, photo counter */}
        <DemoCard l={l} id="1" photoCount={5} />
        {/* Premium — brand ring/stripe + brand-tinted hover elevation, favorite already favorited */}
        <DemoCard l={l} id="2" premium favorited photoCount={8} />
        {/* Reduced-price — old price struck through + new price, reduced badge */}
        <DemoCard l={l} id="3" reduced photoCount={3} />
        {/* Sold — badge + centered rotated overlay, still shows favorite + photo counter */}
        <DemoCard l={l} id="4" sold photoCount={4} />
        {/* No-image fallback — Maximize2 placeholder, no photo counter (count=0) */}
        <DemoCard l={l} id="5" noImage />
        {/* Archived — grayscale/dimmed whole card + archived badge */}
        <DemoCard l={l} id="6" archived photoCount={2} />
      </SimpleGrid>
    );
  },
};
