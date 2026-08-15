import{j as e}from"./iframe-BWqC60Cj.js";import{L as d}from"./LatestListingsView-C6ChNp4o.js";import{A as S}from"./FavoriteButton-DSjl02rU.js";import{m as R}from"./cardListingData.fixture-Cbf1gyx4.js";import"./preload-helper-Dp1pzeXC.js";import"./ListingCard-D-8xd9nT.js";import"./index-C8MEBqML.js";import"./AppImage--686g1R4.js";import"./utils-D5ceN5oG.js";import"./RangeDatePicker-Dt_rNT9t.js";import"./SimpleGrid-KrH1v0nV.js";import"./Text-ZiglToyN.js";import"./Avatar-B1u-IzMg.js";import"./Stack-DqzY2ynC.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import"./index-DUUQ4TXw.js";import"./formatters-BY5HUnlf.js";import"./propertyTypeSchema-BIt1KfNL.js";import"./listingSemanticHelpers-Bf38nK5_.js";import"./building-2-9lGYKeUs.js";import"./bed-double-BYKhWOuE.js";import"./house-mS3JtSOa.js";import"./Skeleton-q4Bsqgtd.js";import"./index-hdwsiLj7.js";import"./server-DtWDQ7N5.js";import"./warnDeprecatedPackage-SJ_BeofI.js";import"./server-D4e9MQwo.js";import"./blockCheck-gQteVmNI.js";import"./admin-OMykPQmP.js";import"./routing-CZLtcx05.js";import"./client-CtwMRmlX.js";import"./toast-DoA0WQwD.js";import"./heart-D83DUq8K.js";import"./_storyI18n-DUPbxmag.js";var u,v,g,_,x,y,f,w,L,h,E,b;const He={title:"System/LatestListings",tags:["autodocs"],parameters:{docs:{description:{component:'Latest listings grid — public homepage section. Canonical grid, migrated to Mantine (Task 668): `<SimpleGrid cols={{ base: 1, md: 2, xxl: 3 }} spacing="sm">`. Statically imports the real production `LatestListingsView`; `Default` renders the signed-in favorited state via a fixed `AuthContext.Provider` fixture (Task 665).'}}}},p={ALL:1,EUR:100},I={id:"story-user-001",public_id:1,name:"Story User",last_name:null,phone:null,whatsapp:null,avatar_url:null,role:"user",user_type:"private",status:"active",block_reason:null,suspended_until:null,company_name:null,company_logo_url:null,company_id:null,website:null,is_verified:!0,social_provider:null,location_id:null,position:null,year_started:null,deleted_at:null,location_request:null,preferred_currency:"EUR",pending_email:null,last_seen_at:null,inactivity_warning_sent_at:null,preferred_locale:"en",created_at:"2026-01-01T00:00:00.000Z"},C={user:I,status:"authenticated",loading:!1,signOut:()=>{},refreshUser:()=>{}},s={render:(T,t)=>{var r,i;const m=(i=t==null||(r=t.globals)===null||r===void 0?void 0:r.locale)!==null&&i!==void 0?i:"en",o=R(m),c=new Set([o[0].id]);return e.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:e.jsx(S.Provider,{value:C,children:e.jsx(d,{listings:o,loading:!1,rates:p,displayCurrency:"EUR",favoriteIds:c})})})},parameters:{docs:{description:{story:"Canonical latest-listings grid column step, Mantine theme breakpoints: 1 col (<768) → 2 cols (md, 768px) → 3 cols (xxl, 1440px) — moved from Tailwind 1536px to Mantine xxl/1440px per the Task 668 owner decision (2026-07-26). Card 0 is favorited (signed-in fixture user) — the real `FavoriteButton` renders filled, not just the guest state."}}},globals:{viewport:{value:"desktop1280",isRotated:!1}}},a={render:(T,t)=>{var r,i;const m=(i=t==null||(r=t.globals)===null||r===void 0?void 0:r.locale)!==null&&i!==void 0?i:"en",o=R(m).slice(0,4),c=new Set([o[0].id]);return e.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:e.jsx(S.Provider,{value:C,children:e.jsx(d,{listings:o,loading:!1,rates:p,displayCurrency:"EUR",favoriteIds:c})})})},parameters:{docs:{description:{story:"@320: longest locale titles — verify line-clamp-2, no horizontal overflow. Use the locale toolbar for sq/en/uk/it."}}},globals:{viewport:{value:"mobile320",isRotated:!1}}},n={render:()=>e.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:e.jsx(d,{listings:[],loading:!0,rates:p,displayCurrency:"EUR",favoriteIds:new Set})}),parameters:{docs:{description:{story:"Loading state — four skeleton rows, rendered by the real `LatestListingsView`'s own loading branch (byte-identical to production, Task 665 — no divergent stand-in)."}}}},l={render:()=>e.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:e.jsx(d,{listings:[],loading:!1,rates:p,displayCurrency:"EUR",favoriteIds:new Set})}),parameters:{docs:{description:{story:"Empty state — zero listings resolved; rendered by the real `LatestListingsView`'s own empty branch (Mantine `Text`, centered, dimmed)."}}}};s.parameters={...s.parameters,docs:{...(u=s.parameters)===null||u===void 0?void 0:u.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const listings = makeCardListingFixtures(locale);
    const favoriteIds = new Set([listings[0]!.id]);
    return <div className="container-wide mx-auto px-4 py-8">\r
        <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>\r
          <LatestListingsView listings={listings} loading={false} rates={FIXTURE_RATES} displayCurrency="EUR" favoriteIds={favoriteIds} />\r
        </AuthContext.Provider>\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Canonical latest-listings grid column step, Mantine theme breakpoints: 1 col (<768) → 2 cols (md, 768px) → 3 cols (xxl, 1440px) — moved from Tailwind 1536px to Mantine xxl/1440px per the Task 668 owner decision (2026-07-26). Card 0 is favorited (signed-in fixture user) — the real \`FavoriteButton\` renders filled, not just the guest state.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(g=s.parameters)===null||g===void 0||(v=g.docs)===null||v===void 0?void 0:v.source}}};a.parameters={...a.parameters,docs:{...(_=a.parameters)===null||_===void 0?void 0:_.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const listings = makeCardListingFixtures(locale).slice(0, 4);
    const favoriteIds = new Set([listings[0]!.id]);
    return <div className="container-wide mx-auto px-4 py-8">\r
        <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>\r
          <LatestListingsView listings={listings} loading={false} rates={FIXTURE_RATES} displayCurrency="EUR" favoriteIds={favoriteIds} />\r
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
}`,...(y=a.parameters)===null||y===void 0||(x=y.docs)===null||x===void 0?void 0:x.source}}};n.parameters={...n.parameters,docs:{...(f=n.parameters)===null||f===void 0?void 0:f.docs,source:{originalSource:`{
  render: () => <div className="container-wide mx-auto px-4 py-8">\r
      <LatestListingsView listings={[]} loading rates={FIXTURE_RATES} displayCurrency="EUR" favoriteIds={new Set()} />\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Loading state — four skeleton rows, rendered by the real \`LatestListingsView\`\\'s own loading branch (byte-identical to production, Task 665 — no divergent stand-in).'
      }
    }
  }
}`,...(L=n.parameters)===null||L===void 0||(w=L.docs)===null||w===void 0?void 0:w.source}}};l.parameters={...l.parameters,docs:{...(h=l.parameters)===null||h===void 0?void 0:h.docs,source:{originalSource:`{
  render: () => <div className="container-wide mx-auto px-4 py-8">\r
      <LatestListingsView listings={[]} loading={false} rates={FIXTURE_RATES} displayCurrency="EUR" favoriteIds={new Set()} />\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Empty state — zero listings resolved; rendered by the real \`LatestListingsView\`\\'s own empty branch (Mantine \`Text\`, centered, dimmed).'
      }
    }
  }
}`,...(b=l.parameters)===null||b===void 0||(E=b.docs)===null||E===void 0?void 0:E.source}}};const Ke=["Default","LocaleStress","Loading","Empty"];export{s as Default,l as Empty,n as Loading,a as LocaleStress,Ke as __namedExportsOrder,He as default};
