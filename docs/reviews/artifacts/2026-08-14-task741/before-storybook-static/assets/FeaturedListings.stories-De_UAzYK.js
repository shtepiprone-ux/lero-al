import{j as o}from"./iframe-BWqC60Cj.js";import{F as c}from"./FeaturedListingsView-KJPz7lG9.js";import{A as R}from"./FavoriteButton-DSjl02rU.js";import{m as T}from"./cardListingData.fixture-Cbf1gyx4.js";import"./preload-helper-Dp1pzeXC.js";import"./ListingCard-D-8xd9nT.js";import"./index-C8MEBqML.js";import"./AppImage--686g1R4.js";import"./utils-D5ceN5oG.js";import"./RangeDatePicker-Dt_rNT9t.js";import"./SimpleGrid-KrH1v0nV.js";import"./Text-ZiglToyN.js";import"./Avatar-B1u-IzMg.js";import"./Stack-DqzY2ynC.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import"./index-DUUQ4TXw.js";import"./formatters-BY5HUnlf.js";import"./propertyTypeSchema-BIt1KfNL.js";import"./listingSemanticHelpers-Bf38nK5_.js";import"./building-2-9lGYKeUs.js";import"./bed-double-BYKhWOuE.js";import"./house-mS3JtSOa.js";import"./typography-DgVg8aJb.js";import"./Skeleton-q4Bsqgtd.js";import"./index-hdwsiLj7.js";import"./server-DtWDQ7N5.js";import"./warnDeprecatedPackage-SJ_BeofI.js";import"./server-D4e9MQwo.js";import"./blockCheck-gQteVmNI.js";import"./admin-OMykPQmP.js";import"./routing-CZLtcx05.js";import"./client-CtwMRmlX.js";import"./toast-DoA0WQwD.js";import"./heart-D83DUq8K.js";import"./_storyI18n-DUPbxmag.js";var v,_,g,x,y,f,h,w,b,E,S,L;const Ke={title:"System/FeaturedListings",tags:["autodocs"],parameters:{docs:{description:{component:'Featured listings grid — public homepage section. Canonical §8.3 card grid, migrated to Mantine (Task 668): `<SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="md">`. Statically imports the real production `FeaturedListingsView`; `Default` renders the signed-in favorited state via a fixed `AuthContext.Provider` fixture (Task 665).'}}}},p={ALL:1,EUR:100},I={id:"story-user-001",public_id:1,name:"Story User",last_name:null,phone:null,whatsapp:null,avatar_url:null,role:"user",user_type:"private",status:"active",block_reason:null,suspended_until:null,company_name:null,company_logo_url:null,company_id:null,website:null,is_verified:!0,social_provider:null,location_id:null,position:null,year_started:null,deleted_at:null,location_request:null,preferred_currency:"EUR",pending_email:null,last_seen_at:null,inactivity_warning_sent_at:null,preferred_locale:"en",created_at:"2026-01-01T00:00:00.000Z"},F={user:I,status:"authenticated",loading:!1,signOut:()=>{},refreshUser:()=>{}},a={render:(m,e)=>{var t,r;const i=(r=e==null||(t=e.globals)===null||t===void 0?void 0:t.locale)!==null&&r!==void 0?r:"en",s=T(i),u=new Set([s[0].id]);return o.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:o.jsx(R.Provider,{value:F,children:o.jsx(c,{listings:s,loading:!1,rates:p,displayCurrency:"EUR",favoriteIds:u,locale:i})})})},parameters:{docs:{description:{story:"Exercises the §8.3 column step across Mantine theme breakpoints: 1 col (<640) → 2 cols (sm, 640px) → 3 cols (xl, 1280px) → 4 cols (xxl, 1440px) — moved from Tailwind 1536px to Mantine xxl/1440px per the Task 668 owner decision (2026-07-26). Card 0 is favorited (signed-in fixture user) — the real `FavoriteButton` renders filled, not just the guest state."}}},globals:{viewport:{value:"desktop1280",isRotated:!1}}},l={render:(m,e)=>{var t,r;const i=(r=e==null||(t=e.globals)===null||t===void 0?void 0:t.locale)!==null&&r!==void 0?r:"en",s=T(i).slice(0,4),u=new Set([s[0].id]);return o.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:o.jsx(R.Provider,{value:F,children:o.jsx(c,{listings:s,loading:!1,rates:p,displayCurrency:"EUR",favoriteIds:u,locale:i})})})},parameters:{docs:{description:{story:"@320: longest locale titles — verify line-clamp-2, no horizontal overflow. Use the locale toolbar for sq/en/uk/it."}}},globals:{viewport:{value:"mobile320",isRotated:!1}}},n={render:(m,e)=>{var t,r;const i=(r=e==null||(t=e.globals)===null||t===void 0?void 0:t.locale)!==null&&r!==void 0?r:"en";return o.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:o.jsx(c,{listings:[],loading:!0,rates:p,displayCurrency:"EUR",favoriteIds:new Set,locale:i})})},parameters:{docs:{description:{story:"Loading state — three skeleton cards, rendered by the real `FeaturedListingsView`'s own loading branch (byte-identical to production, Task 665 — no divergent stand-in)."}}}},d={render:(m,e)=>{var t,r;const i=(r=e==null||(t=e.globals)===null||t===void 0?void 0:t.locale)!==null&&r!==void 0?r:"en";return o.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:o.jsx(c,{listings:[],loading:!1,rates:p,displayCurrency:"EUR",favoriteIds:new Set,locale:i})})},parameters:{docs:{description:{story:"Empty state — zero premium listings resolved; rendered by the real `FeaturedListingsView`'s own empty branch (Mantine `Text`, centered, dimmed)."}}}};a.parameters={...a.parameters,docs:{...(v=a.parameters)===null||v===void 0?void 0:v.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const listings = makeCardListingFixtures(locale);
    const favoriteIds = new Set([listings[0]!.id]);
    return <div className="container-wide mx-auto px-4 py-8">\r
        <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>\r
          <FeaturedListingsView listings={listings} loading={false} rates={FIXTURE_RATES} displayCurrency="EUR" favoriteIds={favoriteIds} locale={locale} />\r
        </AuthContext.Provider>\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Exercises the §8.3 column step across Mantine theme breakpoints: 1 col (<640) → 2 cols (sm, 640px) → 3 cols (xl, 1280px) → 4 cols (xxl, 1440px) — moved from Tailwind 1536px to Mantine xxl/1440px per the Task 668 owner decision (2026-07-26). Card 0 is favorited (signed-in fixture user) — the real \`FavoriteButton\` renders filled, not just the guest state.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(g=a.parameters)===null||g===void 0||(_=g.docs)===null||_===void 0?void 0:_.source}}};l.parameters={...l.parameters,docs:{...(x=l.parameters)===null||x===void 0?void 0:x.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const listings = makeCardListingFixtures(locale).slice(0, 4);
    const favoriteIds = new Set([listings[0]!.id]);
    return <div className="container-wide mx-auto px-4 py-8">\r
        <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>\r
          <FeaturedListingsView listings={listings} loading={false} rates={FIXTURE_RATES} displayCurrency="EUR" favoriteIds={favoriteIds} locale={locale} />\r
        </AuthContext.Provider>\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: '@320: longest locale titles — verify line-clamp-2, no horizontal overflow. Use the locale toolbar for sq/en/uk/it.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(f=l.parameters)===null||f===void 0||(y=f.docs)===null||y===void 0?void 0:y.source}}};n.parameters={...n.parameters,docs:{...(h=n.parameters)===null||h===void 0?void 0:h.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="container-wide mx-auto px-4 py-8">\r
        <FeaturedListingsView listings={[]} loading rates={FIXTURE_RATES} displayCurrency="EUR" favoriteIds={new Set()} locale={locale} />\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state — three skeleton cards, rendered by the real \`FeaturedListingsView\`\\'s own loading branch (byte-identical to production, Task 665 — no divergent stand-in).'
      }
    }
  }
}`,...(b=n.parameters)===null||b===void 0||(w=b.docs)===null||w===void 0?void 0:w.source}}};d.parameters={...d.parameters,docs:{...(E=d.parameters)===null||E===void 0?void 0:E.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="container-wide mx-auto px-4 py-8">\r
        <FeaturedListingsView listings={[]} loading={false} rates={FIXTURE_RATES} displayCurrency="EUR" favoriteIds={new Set()} locale={locale} />\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state — zero premium listings resolved; rendered by the real \`FeaturedListingsView\`\\'s own empty branch (Mantine \`Text\`, centered, dimmed).'
      }
    }
  }
}`,...(L=d.parameters)===null||L===void 0||(S=L.docs)===null||S===void 0?void 0:S.source}}};const Be=["Default","LocaleStress","Loading","Empty"];export{a as Default,d as Empty,n as Loading,l as LocaleStress,Be as __namedExportsOrder,Ke as default};
