import{j as o}from"./iframe-BWqC60Cj.js";import{s as r}from"./_storyI18n-DUPbxmag.js";import{t as v,c as C,I as j}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{F as D}from"./FavoriteButton-DSjl02rU.js";import{S as l}from"./Stack-DqzY2ynC.js";import{T as g}from"./Title-pnvfNB3M.js";import{S as w}from"./SimpleGrid-KrH1v0nV.js";import{D as S}from"./Divider-DJCK80GL.js";import{B as L,a as T}from"./bed-double-BYKhWOuE.js";import{M as _}from"./maximize-2-PobGhKgS.js";import{B as N}from"./building-2-9lGYKeUs.js";import"./preload-helper-Dp1pzeXC.js";import"./Text-ZiglToyN.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";import"./index-hdwsiLj7.js";import"./server-DtWDQ7N5.js";import"./warnDeprecatedPackage-SJ_BeofI.js";import"./server-D4e9MQwo.js";import"./blockCheck-gQteVmNI.js";import"./admin-OMykPQmP.js";import"./routing-CZLtcx05.js";import"./client-CtwMRmlX.js";import"./toast-DoA0WQwD.js";import"./heart-D83DUq8K.js";var u,h,f;const Oo={title:"Patterns/Mantine/ListingCardPattern",component:v,parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:'Complete listing card (Task 605) — single source of truth for the real ListingCard. `layout="grid"` (default, Grid/Latest surfaces) and `layout="list"` (Task 606, List view — structural port of the legacy horizontal branch) both demoed below. Task 656: the favorite slot renders the REAL `FavoriteButton` and the footer copy-id control renders the REAL canonical `MantineCopyIdButton` — no demo stand-ins. Grid cols adapt via SimpleGrid responsive cols. Viewport and locale switched via Storybook toolbar.'}}}},B="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop";function I({src:t,alt:i}){return t?o.jsx(j,{src:t,alt:i,h:180,fit:"cover"}):o.jsx("div",{className:"h-[180px] flex items-center justify-center bg-muted",children:o.jsx(_,{className:"h-8 w-8 text-muted-foreground"})})}function M(t){return[{icon:o.jsx(L,{className:"h-3.5 w-3.5"}),value:r(t,"storybook.mantine.listing_feature_rooms")},{icon:o.jsx(T,{className:"h-3.5 w-3.5"}),value:r(t,"storybook.mantine.listing_feature_bathrooms")},{icon:o.jsx(_,{className:"h-3.5 w-3.5"}),value:r(t,"storybook.mantine.listing_feature_area")},{icon:o.jsx(N,{className:"h-3.5 w-3.5"}),value:r(t,"storybook.mantine.listing_feature_floor")}]}function A({locale:t,id:i,layout:s}){const n=o.jsx(C,{id:i,label:`#${i}`,copyLabel:r(t,"storybook.mantine.copy_id_button_aria_copy"),copiedLabel:r(t,"storybook.mantine.copy_id_button_aria_copied")}),e=o.jsx("span",{className:"whitespace-nowrap",children:r(t,"storybook.mantine.card_footer_date")});return s==="list"?o.jsxs(o.Fragment,{children:[n,e]}):o.jsxs("div",{className:"flex items-center justify-end gap-2 text-xs text-muted-foreground",children:[n,e]})}function a({l:t,id:i,layout:s="grid",reduced:n=!1,premium:e=!1,archived:c=!1,sold:p=!1,noImage:b=!1,favorited:y=!1,photoCount:x=5}){const d=[];!p&&!c&&d.push({label:n?r(t,"storybook.mantine.card_badge_reduced"):r(t,"storybook.mantine.card_badge_new"),color:n?"sale":"green"}),p&&d.push({label:r(t,"storybook.mantine.card_overlay_sold"),color:"blueLight"}),c&&d.push({label:r(t,"storybook.mantine.card_badge_archived"),color:"gray"});const k=p?{label:r(t,"storybook.mantine.card_overlay_sold"),className:"bg-status-info/80 border-status-info"}:void 0;return o.jsx(v,{layout:s,data:{id:i,title:r(t,"storybook.mantine.card_title_1"),location:r(t,"storybook.mantine.card_location_tirana"),price:r(t,"storybook.mantine.card_price_1"),priceOld:n?r(t,"storybook.mantine.card_price_old_1"):void 0},image:o.jsx(I,{src:b?void 0:B,alt:r(t,"storybook.mantine.card_title_1")}),favorite:o.jsx(D,{listingId:i,isFavorited:y,overlay:s==="grid",className:s==="list"?"shrink-0 -mt-0.5 -mr-1":"shadow-sm"}),typeLabel:r(t,"storybook.mantine.card_type_label"),badges:d,overlay:k,photoCount:b?0:x,features:M(t),pricePerSqmStr:r(t,"storybook.mantine.card_price_per_sqm_1"),footerActions:o.jsx(A,{locale:t,id:i,layout:s}),isPremium:e,isArchived:c})}const m={render:(t,i)=>{var s,n;const e=(n=i==null||(s=i.globals)===null||s===void 0?void 0:s.locale)!==null&&n!==void 0?n:"en";return o.jsxs(l,{gap:"xl",p:"md",children:[o.jsxs(l,{gap:"sm",children:[o.jsx(g,{order:4,children:r(e,"storybook.mantine.card_section_grid")}),o.jsxs(w,{cols:{base:1,sm:2,md:3},children:[o.jsx(a,{l:e,id:"1",photoCount:5}),o.jsx(a,{l:e,id:"2",premium:!0,favorited:!0,photoCount:8}),o.jsx(a,{l:e,id:"3",reduced:!0,photoCount:3}),o.jsx(a,{l:e,id:"4",sold:!0,photoCount:4}),o.jsx(a,{l:e,id:"5",noImage:!0}),o.jsx(a,{l:e,id:"6",archived:!0,photoCount:2})]})]}),o.jsx(S,{}),o.jsxs(l,{gap:"sm",children:[o.jsx(g,{order:4,children:r(e,"storybook.mantine.card_section_list")}),o.jsxs(l,{gap:"sm",children:[o.jsx(a,{l:e,id:"7",layout:"list",photoCount:5}),o.jsx(a,{l:e,id:"8",layout:"list",premium:!0,favorited:!0,photoCount:8}),o.jsx(a,{l:e,id:"9",layout:"list",reduced:!0,photoCount:3}),o.jsx(a,{l:e,id:"10",layout:"list",sold:!0,photoCount:4}),o.jsx(a,{l:e,id:"11",layout:"list",noImage:!0}),o.jsx(a,{l:e,id:"12",layout:"list",archived:!0,photoCount:2})]})]})]})}};m.parameters={...m.parameters,docs:{...(u=m.parameters)===null||u===void 0?void 0:u.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <Stack gap="xl" p="md">\r
        <Stack gap="sm">\r
          <Title order={4}>{storyT(l, 'storybook.mantine.card_section_grid')}</Title>\r
          <SimpleGrid cols={{
          base: 1,
          sm: 2,
          md: 3
        }}>\r
            {/* Regular listing — favorite (unfavorited), new badge, photo counter */}\r
            <DemoCard l={l} id="1" photoCount={5} />\r
            {/* Premium — brand ring/stripe + brand-tinted hover elevation, favorite already favorited */}\r
            <DemoCard l={l} id="2" premium favorited photoCount={8} />\r
            {/* Reduced-price — old price struck through + new price, reduced badge */}\r
            <DemoCard l={l} id="3" reduced photoCount={3} />\r
            {/* Sold — badge + centered rotated overlay, still shows favorite + photo counter */}\r
            <DemoCard l={l} id="4" sold photoCount={4} />\r
            {/* No-image fallback — Maximize2 placeholder, no photo counter (count=0) */}\r
            <DemoCard l={l} id="5" noImage />\r
            {/* Archived — grayscale/dimmed whole card + archived badge */}\r
            <DemoCard l={l} id="6" archived photoCount={2} />\r
          </SimpleGrid>\r
        </Stack>\r
\r
        <Divider />\r
\r
        <Stack gap="sm">\r
          <Title order={4}>{storyT(l, 'storybook.mantine.card_section_list')}</Title>\r
          <Stack gap="sm">\r
            {/* Regular — favorite inline (unfavorited), new badge, photo counter bottom-left (Task 656); no overlay (never had one — the badge already conveys sold/rented) */}\r
            <DemoCard l={l} id="7" layout="list" photoCount={5} />\r
            {/* Premium — brand ring + brand-tinted hover elevation, favorite already favorited */}\r
            <DemoCard l={l} id="8" layout="list" premium favorited photoCount={8} />\r
            {/* Reduced-price — old price struck through + new price, reduced badge */}\r
            <DemoCard l={l} id="9" layout="list" reduced photoCount={3} />\r
            {/* Sold — badge conveys status (no centered overlay in list mode) */}\r
            <DemoCard l={l} id="10" layout="list" sold photoCount={4} />\r
            {/* No-image fallback */}\r
            <DemoCard l={l} id="11" layout="list" noImage />\r
            {/* Archived — grayscale/dimmed whole row + archived badge */}\r
            <DemoCard l={l} id="12" layout="list" archived photoCount={2} />\r
          </Stack>\r
        </Stack>\r
      </Stack>;
  }
}`,...(f=m.parameters)===null||f===void 0||(h=f.docs)===null||h===void 0?void 0:h.source}}};const qo=["Default"];export{m as Default,qo as __namedExportsOrder,Oo as default};
