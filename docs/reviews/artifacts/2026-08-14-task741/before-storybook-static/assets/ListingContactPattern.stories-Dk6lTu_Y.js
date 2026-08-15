import{j as i,B as y}from"./iframe-BWqC60Cj.js";import{s as t}from"./_storyI18n-DUPbxmag.js";import{u as n,v as b}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{S as o}from"./Stack-DqzY2ynC.js";import{T as _}from"./Text-ZiglToyN.js";import{A as k}from"./ActionIcon-BlvdNdEl.js";import{H as x}from"./heart-D83DUq8K.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var p,g,u;const bt={title:"Patterns/Mantine/ListingContactPattern",component:n,parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Listing-detail sticky contact card (Task 616 D2) — all Mantine, mirrors ListingContact.tsx content. favorite/inquiry/report are positioned nodes (hook-free split, Task 605 pattern). States: normal / guest-CTA / owner-deleted."}}}};function f(e){return{verified:t(e,"storybook.mantine.listing_detail_verified_label"),call:t(e,"storybook.mantine.listing_contact_call"),whatsapp:t(e,"storybook.mantine.listing_contact_wa"),share:t(e,"storybook.mantine.listing_detail_share"),inquiry:t(e,"storybook.mantine.listing_detail_inquiry"),report:t(e,"storybook.mantine.listing_detail_report"),loginCta:t(e,"storybook.mantine.listing_detail_login_cta"),guestTitle:t(e,"storybook.mantine.listing_detail_guest_title"),guestDesc:t(e,"storybook.mantine.listing_detail_guest_desc"),deletedTitle:t(e,"storybook.mantine.listing_detail_deleted_title"),deletedDesc:t(e,"storybook.mantine.listing_detail_deleted_desc"),unavailableDesc:t(e,"storybook.mantine.listing_detail_unavailable_desc"),closedLabel:t(e,"storybook.mantine.listing_detail_closed_label"),favoriteAriaAdd:t(e,"storybook.mantine.card_favorite_aria_add")}}function v({l:e}){return i.jsx(k,{variant:"default",size:"lg",radius:"xl","aria-label":t(e,"storybook.mantine.card_favorite_aria_add"),children:i.jsx(x,{size:18})})}function T({l:e}){return i.jsx(y,{variant:"outline",fullWidth:!0,leftSection:i.jsx(b,{size:18}),children:t(e,"storybook.mantine.listing_detail_inquiry")})}function h({l:e}){return i.jsx(y,{variant:"subtle",size:"xs",color:"gray",fullWidth:!0,children:t(e,"storybook.mantine.listing_detail_report")})}const a={render:(e,s)=>{var l,m;const r=(m=s==null||(l=s.globals)===null||l===void 0?void 0:l.locale)!==null&&m!==void 0?m:"en",c=f(r),d={price:t(r,"storybook.mantine.card_price_1"),originalPrice:t(r,"storybook.mantine.card_price_old_1"),originalPriceLabel:t(r,"storybook.mantine.listing_detail_original_price_label")};return i.jsxs(o,{gap:"xl",p:"md",maw:360,children:[i.jsxs(o,{gap:"xs",children:[i.jsx(_,{size:"xs",c:"gray.5",fw:500,children:t(r,"storybook.mantine.listing_detail_section_normal")}),i.jsx(n,{state:"normal",agent:{name:t(r,"storybook.mantine.listing_detail_agent_name"),initials:"EH",isVerified:!0,subtitle:t(r,"storybook.mantine.listing_detail_agent_company")},price:d,labels:c,hasPhone:!0,hasWhatsapp:!0,favorite:i.jsx(v,{l:r}),inquiryTrigger:i.jsx(T,{l:r}),reportTrigger:i.jsx(h,{l:r})})]}),i.jsxs(o,{gap:"xs",children:[i.jsx(_,{size:"xs",c:"gray.5",fw:500,children:t(r,"storybook.mantine.listing_detail_section_guest")}),i.jsx(n,{state:"guestCta",agent:{name:"",isVerified:!1},price:d,labels:c})]}),i.jsxs(o,{gap:"xs",children:[i.jsx(_,{size:"xs",c:"gray.5",fw:500,children:t(r,"storybook.mantine.listing_detail_section_deleted")}),i.jsx(n,{state:"ownerDeleted",agent:{name:t(r,"storybook.mantine.listing_detail_deleted_title"),isVerified:!1},price:d,labels:c})]})]})}};a.parameters={...a.parameters,docs:{...(p=a.parameters)===null||p===void 0?void 0:p.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    const labels = makeLabels(l);
    const price = {
      price: storyT(l, 'storybook.mantine.card_price_1'),
      originalPrice: storyT(l, 'storybook.mantine.card_price_old_1'),
      originalPriceLabel: storyT(l, 'storybook.mantine.listing_detail_original_price_label')
    };
    return <Stack gap="xl" p="md" maw={360}>\r
        <Stack gap="xs">\r
          <Text size="xs" c="gray.5" fw={500}>\r
            {storyT(l, 'storybook.mantine.listing_detail_section_normal')}\r
          </Text>\r
          <MantineListingContactPattern state="normal" agent={{
          name: storyT(l, 'storybook.mantine.listing_detail_agent_name'),
          initials: 'EH',
          isVerified: true,
          subtitle: storyT(l, 'storybook.mantine.listing_detail_agent_company')
        }} price={price} labels={labels} hasPhone hasWhatsapp favorite={<DemoFavorite l={l} />} inquiryTrigger={<DemoInquiryTrigger l={l} />} reportTrigger={<DemoReportTrigger l={l} />} />\r
        </Stack>\r
\r
        <Stack gap="xs">\r
          <Text size="xs" c="gray.5" fw={500}>\r
            {storyT(l, 'storybook.mantine.listing_detail_section_guest')}\r
          </Text>\r
          <MantineListingContactPattern state="guestCta" agent={{
          name: '',
          isVerified: false
        }} price={price} labels={labels} />\r
        </Stack>\r
\r
        <Stack gap="xs">\r
          <Text size="xs" c="gray.5" fw={500}>\r
            {storyT(l, 'storybook.mantine.listing_detail_section_deleted')}\r
          </Text>\r
          <MantineListingContactPattern state="ownerDeleted" agent={{
          name: storyT(l, 'storybook.mantine.listing_detail_deleted_title'),
          isVerified: false
        }} price={price} labels={labels} />\r
        </Stack>\r
      </Stack>;
  }
}`,...(u=a.parameters)===null||u===void 0||(g=u.docs)===null||g===void 0?void 0:g.source}}};const kt=["Default"];export{a as Default,kt as __namedExportsOrder,bt as default};
