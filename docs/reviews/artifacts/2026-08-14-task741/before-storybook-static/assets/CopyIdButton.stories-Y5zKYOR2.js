import{j as t}from"./iframe-BWqC60Cj.js";import{s as u}from"./_storyI18n-DUPbxmag.js";import{c as d}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{M as b}from"./_MantineStoryShell-v1yXHo2n.js";import{S as n}from"./Stack-DqzY2ynC.js";import{T as m}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var s,p,c;const{within:g,userEvent:x}=__STORYBOOK_MODULE_TEST__,mt={title:"Mantine/Primitives/CopyIdButton",parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Title under `Mantine/Primitives/` (Task 656) — the rendered-assert harness's\r\n`--mantine-only` gate only gives standing enforcement to stories under this exact\r\nprefix.\r\n\n`MantineCopyIdButton` owns the clipboard write + the Copy↔Check copied-state toggle\r\ninternally (Task 656 extraction from `ListingCard.tsx`). The \"copied\" section below is\r\nreached by a real click in the `play` function (never a baked `defaultCopied`-style\r\nprop — the component has none), matching the owner's real-user-gesture rule for any\r\nstory demonstrating a non-resting state (docs/mantine-responsive-design-system.md §8.2)."}}}},r={render:(l,i)=>{var e,a;const _=(a=i==null||(e=i.globals)===null||e===void 0?void 0:e.locale)!==null&&a!==void 0?a:"en",o=y=>u(_,`storybook.mantine.${y}`);return t.jsx(b,{children:t.jsxs(n,{gap:"xl",children:[t.jsxs(n,{gap:"xs",children:[t.jsx(m,{size:"xs",c:"gray.5",fw:500,children:o("copy_id_button_resting_caption")}),t.jsx(d,{id:"story-listing-001",label:"#1234",copyLabel:o("copy_id_button_aria_copy"),copiedLabel:o("copy_id_button_aria_copied")})]}),t.jsxs(n,{gap:"xs",children:[t.jsx(m,{size:"xs",c:"gray.5",fw:500,children:o("copy_id_button_copied_caption")}),t.jsx(d,{id:"story-listing-002",label:"#5678",copyLabel:o("copy_id_button_aria_copy"),copiedLabel:o("copy_id_button_aria_copied")})]})]})})},play:async({canvasElement:l})=>{const e=await g(l).findAllByRole("button");await x.click(e[1])}};r.parameters={...r.parameters,docs:{...(s=r.parameters)===null||s===void 0?void 0:s.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              {t('copy_id_button_resting_caption')}\r
            </Text>\r
            <MantineCopyIdButton id="story-listing-001" label="#1234" copyLabel={t('copy_id_button_aria_copy')} copiedLabel={t('copy_id_button_aria_copied')} />\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              {t('copy_id_button_copied_caption')}\r
            </Text>\r
            <MantineCopyIdButton id="story-listing-002" label="#5678" copyLabel={t('copy_id_button_aria_copy')} copiedLabel={t('copy_id_button_aria_copied')} />\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const buttons = await canvas.findAllByRole('button');
    // Click ONLY the second instance so both states render side by side — the first
    // stays resting, the second shows the real click → copied transition.
    await userEvent.click(buttons[1]);
  }
}`,...(c=r.parameters)===null||c===void 0||(p=c.docs)===null||p===void 0?void 0:p.source}}};const _t=["Default"];export{r as Default,_t as __namedExportsOrder,mt as default};
