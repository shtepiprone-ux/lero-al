import{j as s}from"./iframe-BWqC60Cj.js";import{s as o}from"./_storyI18n-DUPbxmag.js";import{x as d}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{S as m}from"./Stack-DqzY2ynC.js";import{T as g}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var p,c,_;const{within:y,userEvent:b}=__STORYBOOK_MODULE_TEST__,dt={title:"Patterns/Mantine/ListingGalleryPattern",component:d,parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Listing-detail gallery (Task 616 D1) — the main photo is a Mantine component that owns its own Mantine fullScreen-Modal lightbox (reuses LightboxView, the Task 612 primitive, as the modal it renders). `play` clicks the main photo so the rendered gate captures the lightbox OPEN."}}}},f=[{url:"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80"},{url:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80"},{url:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80"},{url:"https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80"},{url:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80"},{url:"https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&q=80"}],n={render:(u,e)=>{var i,a;const t=(a=e==null||(i=e.globals)===null||i===void 0?void 0:i.locale)!==null&&a!==void 0?a:"en",l=o(t,"storybook.mantine.card_title_1"),r={close:o(t,"storybook.mantine.lightbox_close"),prev:o(t,"storybook.mantine.lightbox_prev"),next:o(t,"storybook.mantine.lightbox_next"),counter:(h,x)=>`${h} / ${x}`,photoCountSuffix:o(t,"storybook.mantine.listing_detail_photo_count_suffix")};return s.jsxs(m,{gap:"xl",p:"md",children:[s.jsxs(m,{gap:"xs",children:[s.jsx(g,{size:"xs",c:"gray.5",fw:500,children:o(t,"storybook.mantine.listing_detail_gallery_section_default")}),s.jsx(d,{images:f,title:l,labels:r})]}),s.jsxs(m,{gap:"xs",children:[s.jsx(g,{size:"xs",c:"gray.5",fw:500,children:o(t,"storybook.mantine.listing_detail_gallery_section_empty")}),s.jsx(d,{images:[],title:l,labels:r})]})]})},play:async({canvasElement:u,globals:e})=>{var i;const a=(i=e==null?void 0:e.locale)!==null&&i!==void 0?i:"en",t=o(a,"storybook.mantine.card_title_1"),r=await y(u).findByRole("button",{name:t});await b.click(r)}};n.parameters={...n.parameters,docs:{...(p=n.parameters)===null||p===void 0?void 0:p.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    const title = storyT(l, 'storybook.mantine.card_title_1');
    const labels = {
      close: storyT(l, 'storybook.mantine.lightbox_close'),
      prev: storyT(l, 'storybook.mantine.lightbox_prev'),
      next: storyT(l, 'storybook.mantine.lightbox_next'),
      // No i18n key — pure digits/slash, matches the real ListingGallery counter format
      // (LightboxView.stories.tsx precedent, Task 612).
      counter: (index: number, total: number) => \`\${index} / \${total}\`,
      photoCountSuffix: storyT(l, 'storybook.mantine.listing_detail_photo_count_suffix')
    };
    return <Stack gap="xl" p="md">\r
        <Stack gap="xs">\r
          <Text size="xs" c="gray.5" fw={500}>\r
            {storyT(l, 'storybook.mantine.listing_detail_gallery_section_default')}\r
          </Text>\r
          <MantineListingGalleryPattern images={DEMO_IMAGES} title={title} labels={labels} />\r
        </Stack>\r
\r
        <Stack gap="xs">\r
          <Text size="xs" c="gray.5" fw={500}>\r
            {storyT(l, 'storybook.mantine.listing_detail_gallery_section_empty')}\r
          </Text>\r
          <MantineListingGalleryPattern images={[]} title={title} labels={labels} />\r
        </Stack>\r
      </Stack>;
  },
  play: async ({
    canvasElement,
    globals
  }) => {
    const l = globals?.locale as string ?? 'en';
    const title = storyT(l, 'storybook.mantine.card_title_1');
    const canvas = within(canvasElement);
    const mainPhoto = await canvas.findByRole('button', {
      name: title
    });
    await userEvent.click(mainPhoto);
  }
}`,...(_=n.parameters)===null||_===void 0||(c=_.docs)===null||c===void 0?void 0:c.source}}};const ut=["Default"];export{n as Default,ut as __namedExportsOrder,dt as default};
