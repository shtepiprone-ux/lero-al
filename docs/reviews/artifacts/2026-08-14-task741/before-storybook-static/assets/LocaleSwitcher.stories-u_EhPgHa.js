import{j as t}from"./iframe-BWqC60Cj.js";import{s as x}from"./_storyI18n-DUPbxmag.js";import{L as n}from"./LocaleSwitcher-DOTZVXuF.js";import{M as _}from"./_MantineStoryShell-v1yXHo2n.js";import{S as r}from"./Stack-DqzY2ynC.js";import{T as l}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./RangeDatePicker-Dt_rNT9t.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import"./loader-circle-DsIh30M6.js";import"./chevron-down-B9O36-Ph.js";var c,p,m;const ht={title:"Mantine/Primitives/LocaleSwitcher",parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Title under `Mantine/Primitives/` (Task 576, canonical Mantine story location gate —\r\nsame rationale as `HeaderActions`/`FiltersPanelShell`/`PhoneField`): the rendered-assert\r\nharness only gives PERMANENT, standing enforcement under `--mantine-only` to stories whose\r\ntitle matches this exact prefix.\r\n\n`LocaleSwitcher` is not in the harness's `MANTINE_OVERLAY_PRIMITIVES` open-trigger set (that\r\nset matches on `DropdownMenu`, not `LocaleSwitcher`, as the title's last segment), so it\r\nrenders the closed trigger — consistent with every other non-overlay-titled Mantine primitive\r\nstory (`HeaderActions`, `FiltersPanelShell`). The menu-open interaction itself is already\r\ncovered by `Mantine/Primitives/DropdownMenu`'s own story."}}}},e={render:(g,o)=>{var i,s;const d=(s=o==null||(i=o.globals)===null||i===void 0?void 0:i.locale)!==null&&s!==void 0?s:"en",a=h=>x(d,`storybook.mantine.${h}`);return t.jsx(_,{children:t.jsxs(r,{gap:"xl",children:[t.jsxs(r,{gap:"xs",children:[t.jsx(l,{size:"xs",c:"gray.5",fw:500,children:a("locale_switcher_default_caption")}),t.jsx(n,{onSwitch:()=>{}})]}),t.jsxs(r,{gap:"xs",children:[t.jsx(l,{size:"xs",c:"gray.5",fw:500,children:a("locale_switcher_showlabel_caption")}),t.jsx(n,{onSwitch:()=>{},showLabel:!0})]}),t.jsxs(r,{gap:"xs",children:[t.jsx(l,{size:"xs",c:"gray.5",fw:500,children:a("locale_switcher_pending_caption")}),t.jsx(n,{onSwitch:()=>{},isPending:!0})]})]})})}};e.parameters={...e.parameters,docs:{...(c=e.parameters)===null||c===void 0?void 0:c.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              {t('locale_switcher_default_caption')}\r
            </Text>\r
            <LocaleSwitcher onSwitch={() => {}} />\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              {t('locale_switcher_showlabel_caption')}\r
            </Text>\r
            <LocaleSwitcher onSwitch={() => {}} showLabel />\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              {t('locale_switcher_pending_caption')}\r
            </Text>\r
            <LocaleSwitcher onSwitch={() => {}} isPending />\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(m=e.parameters)===null||m===void 0||(p=m.docs)===null||p===void 0?void 0:p.source}}};const xt=["Default"];export{e as Default,xt as __namedExportsOrder,ht as default};
