import{j as r}from"./iframe-BWqC60Cj.js";import{R as c,C as E}from"./RecentlyViewedGridView-BJoBmJb1.js";import{m as f}from"./cardListingData.fixture-Cbf1gyx4.js";import"./preload-helper-Dp1pzeXC.js";import"./toast-DoA0WQwD.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./button-DqckHWPj.js";import"./index-D4MQtXW4.js";import"./utils-D5ceN5oG.js";import"./useButton-62N7Qls-.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./dialog-Bpi0EtBt.js";import"./index-PXfbuUw3.js";import"./x-oNeZx8ai.js";import"./DialogTrigger-B5XcOvoT.js";import"./useInteractions-CUNok2Pe.js";import"./useTransitionStatus-C523vQjG.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./inertValue-DeE1CYDS.js";import"./visuallyHidden-COI6QeQH.js";import"./shadowDom-KUr5fxLu.js";import"./index-DTzEXCUc.js";import"./useOpenInteractionType-D7GLRI-3.js";import"./useValueChanged-DYbhOE3F.js";import"./useRole-BHvzd0LU.js";import"./getEmptyRootContext-CBnq-fR5.js";import"./server-DtWDQ7N5.js";import"./warnDeprecatedPackage-SJ_BeofI.js";import"./index-hdwsiLj7.js";import"./server-D4e9MQwo.js";import"./routing-CZLtcx05.js";import"./trash-2-g77RJjTg.js";import"./loader-circle-DsIh30M6.js";import"./ListingCard-D-8xd9nT.js";import"./index-C8MEBqML.js";import"./AppImage--686g1R4.js";import"./RangeDatePicker-Dt_rNT9t.js";import"./SimpleGrid-KrH1v0nV.js";import"./Text-ZiglToyN.js";import"./Avatar-B1u-IzMg.js";import"./Stack-DqzY2ynC.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./Badge-tZlP7Rz3.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./ActionIcon-BlvdNdEl.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./en-US-BBmapk28.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import"./index-DUUQ4TXw.js";import"./formatters-BY5HUnlf.js";import"./propertyTypeSchema-BIt1KfNL.js";import"./listingSemanticHelpers-Bf38nK5_.js";import"./building-2-9lGYKeUs.js";import"./bed-double-BYKhWOuE.js";import"./house-mS3JtSOa.js";import"./FavoriteButton-DSjl02rU.js";import"./blockCheck-gQteVmNI.js";import"./admin-OMykPQmP.js";import"./client-CtwMRmlX.js";import"./heart-D83DUq8K.js";import"./_storyI18n-DUPbxmag.js";var m,u,v,y,g,w,_,b,x,R,S,h;const ao={title:"System/RecentlyViewedSection",tags:["autodocs"],parameters:{docs:{description:{component:"Recently-viewed listings section — responsive layout story. Mobile: horizontal scroll (w-48 cards, no-scrollbar). sm+: 2-col grid → md: 3-col → lg: 4-col. Statically imports the real production `RecentlyViewedGridView` + `ClearRecentlyViewedButton` (profile-context clear slot). See docs/responsive-screenshot-governance.md for screenshot matrix."}}}},d={ALL:1,EUR:100},s={render:(V,e)=>{var o,t;const i=(t=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&t!==void 0?t:"en",l=f(i);return r.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:r.jsx(c,{listings:l,rates:d,displayCurrency:"EUR",clearSlot:r.jsx(E,{})})})},parameters:{docs:{description:{story:"Desktop 1280px: 3-col grid. Full field-parity cards (premium stripe, status badges, price/m², features, photo count, date). Clear button is the real production `ClearRecentlyViewedButton` (opens its own confirm dialog)."}}},globals:{viewport:{value:"desktop1280",isRotated:!1}}},a={render:(V,e)=>{var o,t;const i=(t=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&t!==void 0?t:"en",l=f(i).slice(0,6);return r.jsx("div",{className:"py-4 px-4",children:r.jsx(c,{listings:l,rates:d,displayCurrency:"EUR",clearSlot:r.jsx(E,{})})})},parameters:{docs:{description:{story:"Mobile 375px: horizontal scroll, w-48 shrink-0 cards with full field set. Scrollbar visible in story (production uses no-scrollbar). Swipe or drag horizontally to scroll."}}},globals:{viewport:{value:"mobile375",isRotated:!1}}},p={render:()=>r.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:r.jsx(c,{listings:[],rates:d,displayCurrency:"EUR",showEmptyState:!0})}),parameters:{docs:{description:{story:"Empty state (showEmptyState=true), rendered by the real `RecentlyViewedGridView`'s own empty branch. No clear button when no items."}}}},n={render:(V,e)=>{var o,t;const i=(t=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&t!==void 0?t:"en",l=f(i).slice(0,4);return r.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:r.jsx(c,{listings:l,rates:d,displayCurrency:"EUR",clearSlot:r.jsx(E,{})})})},parameters:{docs:{description:{story:"@320: longest locale titles — title line-clamp-2, badge labels localize, no horizontal overflow. Use locale toolbar for sq/en/uk/it; viewport toolbar for other widths."}}},globals:{viewport:{value:"mobile320",isRotated:!1}}};s.parameters={...s.parameters,docs:{...(m=s.parameters)===null||m===void 0?void 0:m.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const listings = makeCardListingFixtures(locale);
    return <div className="container-wide mx-auto px-4 py-8">\r
        <RecentlyViewedGridView listings={listings} rates={FIXTURE_RATES} displayCurrency="EUR" clearSlot={<ClearRecentlyViewedButton />} />\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Desktop 1280px: 3-col grid. Full field-parity cards (premium stripe, status badges, price/m², features, photo count, date). Clear button is the real production \`ClearRecentlyViewedButton\` (opens its own confirm dialog).'
      }
    }
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(v=s.parameters)===null||v===void 0||(u=v.docs)===null||u===void 0?void 0:u.source}}};a.parameters={...a.parameters,docs:{...(y=a.parameters)===null||y===void 0?void 0:y.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const listings = makeCardListingFixtures(locale).slice(0, 6);
    return <div className="py-4 px-4">\r
        <RecentlyViewedGridView listings={listings} rates={FIXTURE_RATES} displayCurrency="EUR" clearSlot={<ClearRecentlyViewedButton />} />\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile 375px: horizontal scroll, w-48 shrink-0 cards with full field set. Scrollbar visible in story (production uses no-scrollbar). Swipe or drag horizontally to scroll.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
}`,...(w=a.parameters)===null||w===void 0||(g=w.docs)===null||g===void 0?void 0:g.source}}};p.parameters={...p.parameters,docs:{...(_=p.parameters)===null||_===void 0?void 0:_.docs,source:{originalSource:`{
  render: () => <div className="container-wide mx-auto px-4 py-8">\r
      <RecentlyViewedGridView listings={[]} rates={FIXTURE_RATES} displayCurrency="EUR" showEmptyState />\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Empty state (showEmptyState=true), rendered by the real \`RecentlyViewedGridView\`\\'s own empty branch. No clear button when no items.'
      }
    }
  }
}`,...(x=p.parameters)===null||x===void 0||(b=x.docs)===null||b===void 0?void 0:b.source}}};n.parameters={...n.parameters,docs:{...(R=n.parameters)===null||R===void 0?void 0:R.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const listings = makeCardListingFixtures(locale).slice(0, 4);
    return <div className="container-wide mx-auto px-4 py-8">\r
        <RecentlyViewedGridView listings={listings} rates={FIXTURE_RATES} displayCurrency="EUR" clearSlot={<ClearRecentlyViewedButton />} />\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: '@320: longest locale titles — title line-clamp-2, badge labels localize, no horizontal overflow. Use locale toolbar for sq/en/uk/it; viewport toolbar for other widths.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(h=n.parameters)===null||h===void 0||(S=h.docs)===null||S===void 0?void 0:S.source}}};const po=["Populated","MobileScroll","EmptyState","LocaleStress"];export{p as EmptyState,n as LocaleStress,a as MobileScroll,s as Populated,po as __namedExportsOrder,ao as default};
