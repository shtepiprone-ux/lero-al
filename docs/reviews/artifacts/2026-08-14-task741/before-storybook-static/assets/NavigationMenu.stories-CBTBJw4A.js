import{j as t}from"./iframe-BWqC60Cj.js";import{s as k}from"./_storyI18n-DUPbxmag.js";import{g as d}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{M as g}from"./_MantineStoryShell-v1yXHo2n.js";import{S as n}from"./Stack-DqzY2ynC.js";import{T as m}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var l,s,c;const me={title:"Mantine/Primitives/NavigationMenu",parameters:{skipCanvas:!0,layout:"fullscreen"}},i={render:(h,r)=>{var o,a;const _=(a=r==null||(o=r.globals)===null||o===void 0?void 0:o.locale)!==null&&a!==void 0?a:"en",e=b=>k(_,`storybook.mantine.${b}`),p=[{label:e("nav_sec_products"),links:[{label:e("nav_link_overview"),href:"#",onClick:()=>{}},{label:e("nav_link_pricing"),href:"#",onClick:()=>{}},{label:e("nav_link_integrations"),href:"#",onClick:()=>{}}]},{label:e("nav_sec_resources"),links:[{label:e("nav_link_docs"),href:"#",onClick:()=>{}},{label:e("nav_link_blog"),href:"#",onClick:()=>{}},{label:e("nav_link_support"),href:"#",onClick:()=>{},disabled:!0}]}],v=[{label:e("nav_sec_disabled"),links:[{label:e("nav_link_overview"),href:"#",onClick:()=>{}}],disabled:!0},p[1]];return t.jsx(g,{children:t.jsxs(n,{gap:"xl",children:[t.jsxs(n,{gap:"xs",children:[t.jsx(m,{size:"xs",c:"gray.5",fw:500,children:"resting — click a section trigger to open; ≥640: horizontal nav + anchored panel; <640: stacked full-width triggers + shared full-width bottom sheet (drag handle · ≥44px rows · disabled link dimmed · long uk wraps · no h-scroll@320)"}),t.jsx(d,{ariaLabel:e("nav_aria_label"),sections:p})]}),t.jsxs(n,{gap:"xs",children:[t.jsx(m,{size:"xs",c:"gray.5",fw:500,children:"disabled section — first trigger tap is a no-op; no panel/sheet opens for it; second section unaffected"}),t.jsx(d,{ariaLabel:e("nav_aria_label"),sections:v})]})]})})}};i.parameters={...i.parameters,docs:{...(l=i.parameters)===null||l===void 0?void 0:l.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    const sections: NavMenuSection[] = [{
      label: t('nav_sec_products'),
      links: [{
        label: t('nav_link_overview'),
        href: '#',
        onClick: () => {}
      }, {
        label: t('nav_link_pricing'),
        href: '#',
        onClick: () => {}
      }, {
        label: t('nav_link_integrations'),
        href: '#',
        onClick: () => {}
      }]
    }, {
      label: t('nav_sec_resources'),
      links: [{
        label: t('nav_link_docs'),
        href: '#',
        onClick: () => {}
      }, {
        label: t('nav_link_blog'),
        href: '#',
        onClick: () => {}
      }, {
        label: t('nav_link_support'),
        href: '#',
        onClick: () => {},
        disabled: true
      }]
    }];
    const disabledSections: NavMenuSection[] = [{
      label: t('nav_sec_disabled'),
      links: [{
        label: t('nav_link_overview'),
        href: '#',
        onClick: () => {}
      }],
      disabled: true
    }, sections[1]];
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* 1 — resting: click a section trigger to open its links panel\r
              at ≥640 → horizontal nav bar, anchored Mantine Menu per section\r
              at <640 → stacked full-width section triggers, ONE shared bottom sheet\r
              Use the toolbar viewport switcher to verify both paths on this ONE section. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              resting — click a section trigger to open; ≥640: horizontal nav + anchored panel; &lt;640: stacked full-width triggers + shared full-width bottom sheet (drag handle · ≥44px rows · disabled link dimmed · long uk wraps · no h-scroll@320)\r
            </Text>\r
            <MantineNavigationMenu ariaLabel={t('nav_aria_label')} sections={sections} />\r
          </Stack>\r
\r
          {/* 2 — disabled section: trigger tap is a no-op on both paths */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disabled section — first trigger tap is a no-op; no panel/sheet opens for it; second section unaffected\r
            </Text>\r
            <MantineNavigationMenu ariaLabel={t('nav_aria_label')} sections={disabledSections} />\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(c=i.parameters)===null||c===void 0||(s=c.docs)===null||s===void 0?void 0:s.source}}};const _e=["Default"];export{i as Default,_e as __namedExportsOrder,me as default};
