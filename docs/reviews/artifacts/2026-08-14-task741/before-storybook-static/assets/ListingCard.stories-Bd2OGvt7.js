import{j as t}from"./iframe-BWqC60Cj.js";import{s}from"./_storyI18n-DUPbxmag.js";import{L as e}from"./ListingCard-D-8xd9nT.js";import{A as x}from"./FavoriteButton-DSjl02rU.js";import{M as f}from"./_MantineStoryShell-v1yXHo2n.js";import{S as m}from"./Stack-DqzY2ynC.js";import{T as h}from"./Title-pnvfNB3M.js";import{S}from"./SimpleGrid-KrH1v0nV.js";import"./preload-helper-Dp1pzeXC.js";import"./index-C8MEBqML.js";import"./AppImage--686g1R4.js";import"./utils-D5ceN5oG.js";import"./RangeDatePicker-Dt_rNT9t.js";import"./Text-ZiglToyN.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import"./index-DUUQ4TXw.js";import"./formatters-BY5HUnlf.js";import"./propertyTypeSchema-BIt1KfNL.js";import"./listingSemanticHelpers-Bf38nK5_.js";import"./building-2-9lGYKeUs.js";import"./bed-double-BYKhWOuE.js";import"./house-mS3JtSOa.js";import"./index-hdwsiLj7.js";import"./server-DtWDQ7N5.js";import"./warnDeprecatedPackage-SJ_BeofI.js";import"./server-D4e9MQwo.js";import"./blockCheck-gQteVmNI.js";import"./admin-OMykPQmP.js";import"./routing-CZLtcx05.js";import"./client-CtwMRmlX.js";import"./toast-DoA0WQwD.js";import"./heart-D83DUq8K.js";var d,c,u;const Xt={title:"Mantine/Primitives/ListingCard",parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Title under `Mantine/Primitives/` (Task 656) — statically imports the REAL production\r\n`ListingCard` (clause 16c canonical-Story binding). Copy-id (`MantineCopyIdButton`) and\r\nfavorite (`FavoriteButton`) render through the exact same components production uses —\r\nthis story imports zero demo stand-ins.\r\n\n`FavoriteButton` reads auth via `useAuth()` (`@/modules/auth/context/AuthContext`). The\r\nreal `AuthProvider` cannot be used here — its `useEffect` mount calls\r\n`AuthController.mount()`, which subscribes to a live Supabase client (forbidden in\r\nstories). Instead this story wraps with the exported `AuthContext.Provider` directly and\r\nsupplies a fixture signed-in value, bypassing the controller/Supabase wiring entirely\r\nwhile still exercising the real `FavoriteButton` in its authenticated state."}}}},o={ALL:1,EUR:100},T="2026-07-28T00:00:00.000Z",b={id:"story-user-001",public_id:1,name:"Story User",last_name:null,phone:null,whatsapp:null,avatar_url:null,role:"user",user_type:"private",status:"active",block_reason:null,suspended_until:null,company_name:null,company_logo_url:null,company_id:null,website:null,is_verified:!0,social_provider:null,location_id:null,position:null,year_started:null,deleted_at:null,location_request:null,preferred_currency:"EUR",pending_email:null,last_seen_at:null,inactivity_warning_sent_at:null,preferred_locale:"en",created_at:"2026-01-01T00:00:00.000Z"},E={user:b,status:"authenticated",loading:!1,signOut:()=>{},refreshUser:()=>{}};function _(a,r="active"){return{id:`story-listing-001-${r}`,public_id:1234,slug:"modern-apartment-tirana-center",title:s(a,"storybook.mantine.card_title_1"),price:8e4,currency:"EUR",listing_type:"sale",property_type:"apartment",is_premium:!1,status:r,created_at:T,images:[{url:"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop",is_cover:!0,order:0}],location:{id:1,name_al:s(a,"storybook.mantine.card_location_tirana"),slug:"tirane",type:"city"},area_gross:85,bedrooms:3,bathrooms:2}}const n={render:(a,r)=>{var l,p;const i=(p=r==null||(l=r.globals)===null||l===void 0?void 0:l.locale)!==null&&p!==void 0?p:"en",g=_(i),v=_(i,"sold"),y=_(i,"rented");return t.jsx(x.Provider,{value:E,children:t.jsx(f,{children:t.jsxs(m,{gap:"xl",children:[t.jsxs(m,{gap:"sm",children:[t.jsx(h,{order:4,children:s(i,"storybook.mantine.card_section_grid")}),t.jsxs(S,{cols:{base:1,sm:2,md:3},children:[t.jsx(e,{listing:g,variant:"vertical",rates:o}),t.jsx(e,{listing:v,variant:"vertical",rates:o}),t.jsx(e,{listing:y,variant:"vertical",rates:o})]})]}),t.jsxs(m,{gap:"sm",children:[t.jsx(h,{order:4,children:s(i,"storybook.mantine.card_section_list")}),t.jsx(e,{listing:g,variant:"horizontal",rates:o})]})]})})})}};n.parameters={...n.parameters,docs:{...(d=n.parameters)===null||d===void 0?void 0:d.docs,source:{originalSource:`{
  render: (_args, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    const listing = makeFixtureListing(l);
    // Task 741 §3.8 — production rendered proof of the migrated sold/rented overlay colours.
    // \`ListingCard.tsx\`'s \`isClosed\` branch (\`:267-269\`) is the in-scope production consumer;
    // authorised as a permanent \`Default\` export extension (single-export rule, governance §8)
    // by the quoted 2026-08-14 owner decision (see the kickoff's canonical UI decision record).
    // Sold then rented, in that DOM order, so a structural (never text) selector can find both.
    const soldListing = makeFixtureListing(l, 'sold');
    const rentedListing = makeFixtureListing(l, 'rented');
    return <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>\r
        <MantineStoryShell>\r
          <Stack gap="xl">\r
            <Stack gap="sm">\r
              <Title order={4}>{storyT(l, 'storybook.mantine.card_section_grid')}</Title>\r
              <SimpleGrid cols={{
              base: 1,
              sm: 2,
              md: 3
            }}>\r
                <ListingCard listing={listing} variant="vertical" rates={FIXTURE_RATES} />\r
                <ListingCard listing={soldListing} variant="vertical" rates={FIXTURE_RATES} />\r
                <ListingCard listing={rentedListing} variant="vertical" rates={FIXTURE_RATES} />\r
              </SimpleGrid>\r
            </Stack>\r
\r
            <Stack gap="sm">\r
              <Title order={4}>{storyT(l, 'storybook.mantine.card_section_list')}</Title>\r
              <ListingCard listing={listing} variant="horizontal" rates={FIXTURE_RATES} />\r
            </Stack>\r
          </Stack>\r
        </MantineStoryShell>\r
      </AuthContext.Provider>;
  }
}`,...(u=n.parameters)===null||u===void 0||(c=u.docs)===null||c===void 0?void 0:c.source}}};const Gt=["Default"];export{n as Default,Gt as __namedExportsOrder,Xt as default};
