import{j as t}from"./iframe-BWqC60Cj.js";import{F as v}from"./FeaturedListingsView-KJPz7lG9.js";import{L as f}from"./LatestListingsView-C6ChNp4o.js";import{A as L}from"./FavoriteButton-DSjl02rU.js";import{m as w}from"./cardListingData.fixture-Cbf1gyx4.js";import{S as x}from"./Stack-DqzY2ynC.js";import"./preload-helper-Dp1pzeXC.js";import"./ListingCard-D-8xd9nT.js";import"./index-C8MEBqML.js";import"./AppImage--686g1R4.js";import"./utils-D5ceN5oG.js";import"./RangeDatePicker-Dt_rNT9t.js";import"./SimpleGrid-KrH1v0nV.js";import"./Text-ZiglToyN.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import"./index-DUUQ4TXw.js";import"./formatters-BY5HUnlf.js";import"./propertyTypeSchema-BIt1KfNL.js";import"./listingSemanticHelpers-Bf38nK5_.js";import"./building-2-9lGYKeUs.js";import"./bed-double-BYKhWOuE.js";import"./house-mS3JtSOa.js";import"./typography-DgVg8aJb.js";import"./Skeleton-q4Bsqgtd.js";import"./index-hdwsiLj7.js";import"./server-DtWDQ7N5.js";import"./warnDeprecatedPackage-SJ_BeofI.js";import"./server-D4e9MQwo.js";import"./blockCheck-gQteVmNI.js";import"./admin-OMykPQmP.js";import"./routing-CZLtcx05.js";import"./client-CtwMRmlX.js";import"./toast-DoA0WQwD.js";import"./heart-D83DUq8K.js";import"./_storyI18n-DUPbxmag.js";var d,p,m,c,u,g;const Bt={title:"Patterns/Mantine/HomepageListingGrids",parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Homepage Featured/Latest listing grids (Task 668) — migrated from raw Tailwind grid containers to Mantine `SimpleGrid`, with the large-desktop column step moved from Tailwind `2xl` (1536px) to Mantine `xxl` (1440px), an owner-approved adaptive change (2026-07-26). Statically imports the real production `FeaturedListingsView` and `LatestListingsView` by direct file path — the canonical coverage story for the Mantine migration-scope enrolment of both Views."}}}},n={ALL:1,EUR:100},h={id:"story-user-001",public_id:1,name:"Story User",last_name:null,phone:null,whatsapp:null,avatar_url:null,role:"user",user_type:"private",status:"active",block_reason:null,suspended_until:null,company_name:null,company_logo_url:null,company_id:null,website:null,is_verified:!0,social_provider:null,location_id:null,position:null,year_started:null,deleted_at:null,location_request:null,preferred_currency:"EUR",pending_email:null,last_seen_at:null,inactivity_warning_sent_at:null,preferred_locale:"en",created_at:"2026-01-01T00:00:00.000Z"},E={user:h,status:"authenticated",loading:!1,signOut:()=>{},refreshUser:()=>{}},a={render:(y,e)=>{var r,i;const o=(i=e==null||(r=e.globals)===null||r===void 0?void 0:r.locale)!==null&&i!==void 0?i:"en",l=w(o),_=new Set([l[0].id]);return t.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:t.jsx(L.Provider,{value:E,children:t.jsxs(x,{gap:"xl",children:[t.jsx(v,{listings:l,loading:!1,rates:n,displayCurrency:"EUR",favoriteIds:_,locale:o}),t.jsx(f,{listings:l,loading:!1,rates:n,displayCurrency:"EUR",favoriteIds:_})]})})})},parameters:{docs:{description:{story:"Both migrated grids populated — Featured steps 1/2/3/4 cols at </640/640/1280/1440, Latest steps 1/2/3 cols at </768/768/1440. Card 0 is favorited (signed-in fixture user)."}}}},s={render:(y,e)=>{var r,i;const o=(i=e==null||(r=e.globals)===null||r===void 0?void 0:r.locale)!==null&&i!==void 0?i:"en";return t.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:t.jsxs(x,{gap:"xl",children:[t.jsx(v,{listings:[],loading:!0,rates:n,displayCurrency:"EUR",favoriteIds:new Set,locale:o}),t.jsx(f,{listings:[],loading:!0,rates:n,displayCurrency:"EUR",favoriteIds:new Set})]})})},parameters:{docs:{description:{story:"Both grids in their loading branch — 3 Featured / 4 Latest skeletons, rendered by the Views' own loading branches (byte-identical to production). A deliberate, permanent skeleton state — allowlisted in `LOADER_ALLOWLIST`, not a real defect."}}}};a.parameters={...a.parameters,docs:{...(d=a.parameters)===null||d===void 0?void 0:d.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const listings = makeCardListingFixtures(locale);
    const favoriteIds = new Set([listings[0]!.id]);
    return <div className="container-wide mx-auto px-4 py-8">\r
        <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>\r
          <Stack gap="xl">\r
            <FeaturedListingsView listings={listings} loading={false} rates={FIXTURE_RATES} displayCurrency="EUR" favoriteIds={favoriteIds} locale={locale} />\r
            <LatestListingsView listings={listings} loading={false} rates={FIXTURE_RATES} displayCurrency="EUR" favoriteIds={favoriteIds} />\r
          </Stack>\r
        </AuthContext.Provider>\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Both migrated grids populated — Featured steps 1/2/3/4 cols at </640/640/1280/1440, ' + 'Latest steps 1/2/3 cols at </768/768/1440. Card 0 is favorited (signed-in fixture user).'
      }
    }
  }
}`,...(m=a.parameters)===null||m===void 0||(p=m.docs)===null||p===void 0?void 0:p.source}}};s.parameters={...s.parameters,docs:{...(c=s.parameters)===null||c===void 0?void 0:c.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="container-wide mx-auto px-4 py-8">\r
        <Stack gap="xl">\r
          <FeaturedListingsView listings={[]} loading rates={FIXTURE_RATES} displayCurrency="EUR" favoriteIds={new Set()} locale={locale} />\r
          <LatestListingsView listings={[]} loading rates={FIXTURE_RATES} displayCurrency="EUR" favoriteIds={new Set()} />\r
        </Stack>\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Both grids in their loading branch — 3 Featured / 4 Latest skeletons, rendered by the ' + 'Views\\' own loading branches (byte-identical to production). A deliberate, permanent ' + 'skeleton state — allowlisted in \`LOADER_ALLOWLIST\`, not a real defect.'
      }
    }
  }
}`,...(g=s.parameters)===null||g===void 0||(u=g.docs)===null||u===void 0?void 0:u.source}}};const Gt=["Default","Loading"];export{a as Default,s as Loading,Gt as __namedExportsOrder,Bt as default};
