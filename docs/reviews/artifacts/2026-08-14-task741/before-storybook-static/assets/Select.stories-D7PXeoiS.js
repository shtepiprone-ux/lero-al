import{j as r}from"./iframe-BWqC60Cj.js";import{s as x}from"./_storyI18n-DUPbxmag.js";import{k as p}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{M as b}from"./_MantineStoryShell-v1yXHo2n.js";import{S as o}from"./Stack-DqzY2ynC.js";import{T as n}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var d,c,m;const ce={title:"Mantine/Primitives/Select",parameters:{skipCanvas:!0,layout:"fullscreen"}},a={render:(u,l)=>{var t,s;const h=(s=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&s!==void 0?s:"en",e=_=>x(h,`storybook.mantine.${_}`),i=[{value:"apartment",label:e("sel_option_apartment")},{value:"house",label:e("sel_option_house")},{value:"commercial",label:e("sel_option_commercial")},{value:"land",label:e("sel_option_land")}];return r.jsx(b,{children:r.jsxs(o,{gap:"xl",children:[r.jsxs(o,{gap:"xs",children:[r.jsx(n,{size:"xs",c:"gray.5",fw:500,children:"resting — §6d chrome: gray-2 border / shadow-xs / brand focus / gray-4 placeholder / 44px; full-width <640, anchored ≥640"}),r.jsx(p,{label:e("sel_label"),placeholder:e("sel_placeholder"),description:e("sel_hint"),data:i})]}),r.jsxs(o,{gap:"xs",children:[r.jsx(n,{size:"xs",c:"gray.5",fw:500,children:"error — red-6 border / no shadow; error message wraps at 320 in all 4 locales"}),r.jsx(p,{label:e("sel_label"),placeholder:e("sel_placeholder"),data:i,error:e("sel_error")})]}),r.jsxs(o,{gap:"xs",children:[r.jsx(n,{size:"xs",c:"gray.5",fw:500,children:"disabled — whole control faded (label + field + chevron → opacity 0.5); no focus ring; tap is a no-op at any width"}),r.jsx(p,{label:e("sel_label"),placeholder:e("sel_placeholder"),data:i,disabled:!0})]})]})})}};a.parameters={...a.parameters,docs:{...(d=a.parameters)===null||d===void 0?void 0:d.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    const options = [{
      value: 'apartment',
      label: t('sel_option_apartment')
    }, {
      value: 'house',
      label: t('sel_option_house')
    }, {
      value: 'commercial',
      label: t('sel_option_commercial')
    }, {
      value: 'land',
      label: t('sel_option_land')
    }];
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* 1 — resting: §6d chrome (gray-2 border / shadow-xs / brand focus / 44px); responsive by default */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              resting — §6d chrome: gray-2 border / shadow-xs / brand focus / gray-4 placeholder / 44px; full-width &lt;640, anchored ≥640\r
            </Text>\r
            <MantineSelect label={t('sel_label')} placeholder={t('sel_placeholder')} description={t('sel_hint')} data={options} />\r
          </Stack>\r
\r
          {/* 2 — error: red-6 border / no shadow; data-error state */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              error — red-6 border / no shadow; error message wraps at 320 in all 4 locales\r
            </Text>\r
            <MantineSelect label={t('sel_label')} placeholder={t('sel_placeholder')} data={options} error={t('sel_error')} />\r
          </Stack>\r
\r
          {/* 3 — disabled: whole control faded (§6e); no focus ring; at <640 tap is a no-op */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disabled — whole control faded (label + field + chevron → opacity 0.5); no focus ring; tap is a no-op at any width\r
            </Text>\r
            <MantineSelect label={t('sel_label')} placeholder={t('sel_placeholder')} data={options} disabled />\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(m=a.parameters)===null||m===void 0||(c=m.docs)===null||c===void 0?void 0:c.source}}};const me=["Default"];export{a as Default,me as __namedExportsOrder,ce as default};
