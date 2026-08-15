import{j as o,B as m}from"./iframe-BWqC60Cj.js";import{s as t}from"./_storyI18n-DUPbxmag.js";import{w as c,v as k}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{A as h}from"./ActionIcon-BlvdNdEl.js";import{H as f}from"./heart-D83DUq8K.js";import{B as v,a as T}from"./bed-double-BYKhWOuE.js";import{M as x}from"./maximize-2-PobGhKgS.js";import{B as w}from"./building-2-9lGYKeUs.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Text-ZiglToyN.js";import"./Avatar-B1u-IzMg.js";import"./Stack-DqzY2ynC.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var s,_,d;const Lt={title:"Patterns/Mantine/ListingDetailPattern",component:c,parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Complete listing-detail surface (Task 616 D3, ALL-Mantine rebuild) — composes the D1 gallery pattern (photo -> Mantine lightbox) + a Mantine info block (badges/price/meta/key-features card/description card/amenities card) + the D2 sticky contact card. Fixture cited to presentationEngine.ts getDetailFeatures/getDetailAttributes. Viewport and locale switched via Storybook toolbar."}}}},D=[{url:"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80"},{url:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80"},{url:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80"},{url:"https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80"},{url:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80"}];function q({l:i}){return o.jsx(h,{variant:"default",size:"lg",radius:"xl","aria-label":t(i,"storybook.mantine.card_favorite_aria_add"),children:o.jsx(f,{size:18})})}function L({l:i}){return o.jsx(m,{variant:"outline",fullWidth:!0,leftSection:o.jsx(k,{size:18}),children:t(i,"storybook.mantine.listing_detail_inquiry")})}function j({l:i}){return o.jsx(m,{variant:"subtle",size:"xs",color:"gray",fullWidth:!0,children:t(i,"storybook.mantine.listing_detail_report")})}function M(i){return[{icon:o.jsx(v,{size:14}),label:t(i,"storybook.mantine.listing_detail_feature_label_rooms"),value:"3"},{icon:o.jsx(T,{size:14}),label:t(i,"storybook.mantine.listing_detail_feature_label_bathrooms"),value:"2"},{icon:o.jsx(x,{size:14}),label:t(i,"storybook.mantine.listing_detail_feature_label_area"),value:"85 m²"},{icon:o.jsx(w,{size:14}),label:t(i,"storybook.mantine.listing_detail_feature_label_floor"),value:"3/5"}]}function P(i){return[{label:t(i,"storybook.mantine.listing_detail_amenity_condition_label"),value:t(i,"storybook.mantine.listing_detail_amenity_condition_value")},{label:t(i,"storybook.mantine.listing_detail_amenity_heating_label"),value:t(i,"storybook.mantine.listing_detail_amenity_heating_value")},{label:t(i,"storybook.mantine.listing_detail_amenity_wall_label"),value:t(i,"storybook.mantine.listing_detail_amenity_wall_value")}]}function A(i){return[{label:t(i,"storybook.mantine.card_badge_new"),tone:"new"},{label:t(i,"storybook.mantine.card_badge_premium"),tone:"premium"},{label:t(i,"storybook.mantine.card_badge_reduced"),tone:"reduced"},{label:t(i,"storybook.mantine.card_type_label"),tone:"type"}]}const n={render:(i,a)=>{var r,l;const e=(l=a==null||(r=a.globals)===null||r===void 0?void 0:r.locale)!==null&&l!==void 0?l:"en",p=t(e,"storybook.mantine.card_title_1"),b={close:t(e,"storybook.mantine.lightbox_close"),prev:t(e,"storybook.mantine.lightbox_prev"),next:t(e,"storybook.mantine.lightbox_next"),counter:(g,u)=>`${g} / ${u}`,photoCountSuffix:t(e,"storybook.mantine.listing_detail_photo_count_suffix")},y={price:t(e,"storybook.mantine.card_price_1"),originalPrice:t(e,"storybook.mantine.card_price_old_1"),originalPriceLabel:t(e,"storybook.mantine.listing_detail_original_price_label")};return o.jsx("div",{style:{padding:"var(--mantine-spacing-md)",paddingTop:80},children:o.jsx(c,{data:{title:p,location:t(e,"storybook.mantine.card_location_tirana"),price:t(e,"storybook.mantine.card_price_1"),priceOld:t(e,"storybook.mantine.card_price_old_1"),originalPriceLabel:t(e,"storybook.mantine.listing_detail_original_price_label"),pricePerSqm:t(e,"storybook.mantine.card_price_per_sqm_1"),views:128,viewsLabel:t(e,"storybook.mantine.listing_detail_views_label"),date:t(e,"storybook.mantine.card_footer_date"),publicId:t(e,"storybook.mantine.listing_detail_public_id"),description:t(e,"storybook.mantine.listing_detail_description")},images:D,galleryLabels:b,badges:A(e),features:M(e),descriptionTitle:t(e,"storybook.mantine.listing_detail_description_title"),amenitiesTitle:t(e,"storybook.mantine.listing_detail_amenities_title"),amenities:P(e),contact:{state:"normal",agent:{name:t(e,"storybook.mantine.listing_detail_agent_name"),initials:"EH",isVerified:!0,subtitle:t(e,"storybook.mantine.listing_detail_agent_company")},price:y,labels:{verified:t(e,"storybook.mantine.listing_detail_verified_label"),call:t(e,"storybook.mantine.listing_contact_call"),whatsapp:t(e,"storybook.mantine.listing_contact_wa"),share:t(e,"storybook.mantine.listing_detail_share"),inquiry:t(e,"storybook.mantine.listing_detail_inquiry"),report:t(e,"storybook.mantine.listing_detail_report"),loginCta:t(e,"storybook.mantine.listing_detail_login_cta"),guestTitle:t(e,"storybook.mantine.listing_detail_guest_title"),guestDesc:t(e,"storybook.mantine.listing_detail_guest_desc"),deletedTitle:t(e,"storybook.mantine.listing_detail_deleted_title"),deletedDesc:t(e,"storybook.mantine.listing_detail_deleted_desc"),unavailableDesc:t(e,"storybook.mantine.listing_detail_unavailable_desc"),closedLabel:t(e,"storybook.mantine.listing_detail_closed_label"),favoriteAriaAdd:t(e,"storybook.mantine.card_favorite_aria_add")},hasPhone:!0,hasWhatsapp:!0,favorite:o.jsx(q,{l:e}),inquiryTrigger:o.jsx(L,{l:e}),reportTrigger:o.jsx(j,{l:e})}})})}};n.parameters={...n.parameters,docs:{...(s=n.parameters)===null||s===void 0?void 0:s.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    const title = storyT(l, 'storybook.mantine.card_title_1');
    const galleryLabels = {
      close: storyT(l, 'storybook.mantine.lightbox_close'),
      prev: storyT(l, 'storybook.mantine.lightbox_prev'),
      next: storyT(l, 'storybook.mantine.lightbox_next'),
      counter: (index: number, total: number) => \`\${index} / \${total}\`,
      photoCountSuffix: storyT(l, 'storybook.mantine.listing_detail_photo_count_suffix')
    };
    const priceInfo = {
      price: storyT(l, 'storybook.mantine.card_price_1'),
      originalPrice: storyT(l, 'storybook.mantine.card_price_old_1'),
      originalPriceLabel: storyT(l, 'storybook.mantine.listing_detail_original_price_label')
    };
    return (
      // paddingTop matches the contact card's own \`position:'sticky', top:80\` offset (the
      // Task 615/legacy \`top-20\` header-clearance value, cited in MantineListingDetailPattern.tsx).
      // On the real page this offset never visibly triggers a gap — \`Header.tsx\` is a normal
      // in-flow bar (not sticky/fixed), so the header + breadcrumb bar above the fold already
      // push the grid row well past 80px before any scroll happens. This isolated story has no
      // such chrome above it, so without this spacer the sticky constraint holds the card at
      // \`top:80\` from the very first paint while the gallery starts at the story's own padding
      // (16px) — a story-only visual artifact, not a production defect. Matching the padding to
      // the SAME already-cited 80px keeps the two columns visually level, exactly as they render
      // in production.
      <div style={{
        padding: 'var(--mantine-spacing-md)',
        paddingTop: 80
      }}>\r
        <MantineListingDetailPattern data={{
          title,
          location: storyT(l, 'storybook.mantine.card_location_tirana'),
          price: storyT(l, 'storybook.mantine.card_price_1'),
          priceOld: storyT(l, 'storybook.mantine.card_price_old_1'),
          originalPriceLabel: storyT(l, 'storybook.mantine.listing_detail_original_price_label'),
          pricePerSqm: storyT(l, 'storybook.mantine.card_price_per_sqm_1'),
          views: 128,
          viewsLabel: storyT(l, 'storybook.mantine.listing_detail_views_label'),
          date: storyT(l, 'storybook.mantine.card_footer_date'),
          publicId: storyT(l, 'storybook.mantine.listing_detail_public_id'),
          description: storyT(l, 'storybook.mantine.listing_detail_description')
        }} images={DEMO_IMAGES} galleryLabels={galleryLabels} badges={demoBadges(l)} features={demoFeatures(l)} descriptionTitle={storyT(l, 'storybook.mantine.listing_detail_description_title')} amenitiesTitle={storyT(l, 'storybook.mantine.listing_detail_amenities_title')} amenities={demoAmenities(l)} contact={{
          state: 'normal',
          agent: {
            name: storyT(l, 'storybook.mantine.listing_detail_agent_name'),
            initials: 'EH',
            isVerified: true,
            subtitle: storyT(l, 'storybook.mantine.listing_detail_agent_company')
          },
          price: priceInfo,
          labels: {
            verified: storyT(l, 'storybook.mantine.listing_detail_verified_label'),
            call: storyT(l, 'storybook.mantine.listing_contact_call'),
            whatsapp: storyT(l, 'storybook.mantine.listing_contact_wa'),
            share: storyT(l, 'storybook.mantine.listing_detail_share'),
            inquiry: storyT(l, 'storybook.mantine.listing_detail_inquiry'),
            report: storyT(l, 'storybook.mantine.listing_detail_report'),
            loginCta: storyT(l, 'storybook.mantine.listing_detail_login_cta'),
            guestTitle: storyT(l, 'storybook.mantine.listing_detail_guest_title'),
            guestDesc: storyT(l, 'storybook.mantine.listing_detail_guest_desc'),
            deletedTitle: storyT(l, 'storybook.mantine.listing_detail_deleted_title'),
            deletedDesc: storyT(l, 'storybook.mantine.listing_detail_deleted_desc'),
            unavailableDesc: storyT(l, 'storybook.mantine.listing_detail_unavailable_desc'),
            closedLabel: storyT(l, 'storybook.mantine.listing_detail_closed_label'),
            favoriteAriaAdd: storyT(l, 'storybook.mantine.card_favorite_aria_add')
          },
          hasPhone: true,
          hasWhatsapp: true,
          favorite: <DemoFavorite l={l} />,
          inquiryTrigger: <DemoInquiryTrigger l={l} />,
          reportTrigger: <DemoReportTrigger l={l} />
        }} />\r
      </div>
    );
  }
}`,...(d=n.parameters)===null||d===void 0||(_=d.docs)===null||_===void 0?void 0:_.source}}};const jt=["Default"];export{n as Default,jt as __namedExportsOrder,Lt as default};
