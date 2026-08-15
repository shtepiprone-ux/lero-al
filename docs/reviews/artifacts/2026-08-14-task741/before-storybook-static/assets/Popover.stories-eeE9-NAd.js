import{j as t,B as g}from"./iframe-BWqC60Cj.js";import{s as u}from"./_storyI18n-DUPbxmag.js";import{i as l}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{M as v}from"./_MantineStoryShell-v1yXHo2n.js";import{T as e}from"./Text-ZiglToyN.js";import{S as o}from"./Stack-DqzY2ynC.js";import{A as _}from"./ActionIcon-BlvdNdEl.js";import{E as f}from"./ellipsis-vertical-CZebx50N.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var c,m,d;const xt={title:"Mantine/Primitives/Popover",parameters:{skipCanvas:!0,layout:"fullscreen"}},i={render:(y,a)=>{var n,s;const h=(s=a==null||(n=a.globals)===null||n===void 0?void 0:n.locale)!==null&&s!==void 0?s:"en",r=x=>u(h,`storybook.mantine.${x}`),p=t.jsxs(t.Fragment,{children:[t.jsx(e,{fw:600,size:"sm",c:"gray.8",mb:8,children:r("pop_content_heading")}),t.jsx(e,{size:"sm",c:"gray.7",style:{whiteSpace:"normal",wordBreak:"break-word"},children:r("pop_content_body")})]});return t.jsx(v,{children:t.jsxs(o,{gap:"xl",children:[t.jsxs(o,{gap:"xs",children:[t.jsx(e,{size:"xs",c:"gray.5",fw:500,children:"trigger (closed/resting) — click trigger to open; ≥640: anchored Mantine Popover; <640: full-width bottom sheet (drag handle · ≤90dvh · long uk wraps · no h-scroll@320)"}),t.jsx(l,{trigger:t.jsx(g,{variant:"default",children:r("pop_trigger")}),title:r("pop_title"),children:p})]}),t.jsxs(o,{gap:"xs",children:[t.jsx(e,{size:"xs",c:"gray.5",fw:500,children:"disabled — trigger tap is a no-op; popover/sheet does NOT open; no focus ring"}),t.jsx(l,{trigger:t.jsx(g,{variant:"default",disabled:!0,children:r("pop_trigger")}),title:r("pop_title"),disabled:!0,children:p})]}),t.jsxs(o,{gap:"xs",children:[t.jsx(e,{size:"xs",c:"gray.5",fw:500,children:"icon-only trigger (clause-11 exempt) — compact at <640; taps still open the sheet"}),t.jsx(l,{trigger:t.jsx(_,{variant:"default","aria-label":r("pop_icononly_aria"),mih:"2.75rem",miw:"2.75rem",children:t.jsx(f,{size:16})}),title:r("pop_title"),iconOnlyTrigger:!0,children:p})]})]})})}};i.parameters={...i.parameters,docs:{...(c=i.parameters)===null||c===void 0?void 0:c.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);

    // No outer Box — MantinePopover supplies the mobile content gutter (Task 520);
    // desktop Popover.Dropdown carries its own default padding.
    const content = <>\r
        <Text fw={600} size="sm" c="gray.8" mb={8}>{t('pop_content_heading')}</Text>\r
        <Text size="sm" c="gray.7" style={{
        whiteSpace: 'normal',
        wordBreak: 'break-word'
      }}>\r
          {t('pop_content_body')}\r
        </Text>\r
      </>;
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* 1 — trigger (closed/resting): click trigger to open\r
              at ≥640 → anchored Mantine Popover; at <640 → full-width bottom sheet\r
              Use the toolbar viewport switcher to verify both paths on this ONE section. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              trigger (closed/resting) — click trigger to open; ≥640: anchored Mantine Popover; &lt;640: full-width bottom sheet (drag handle · ≤90dvh · long uk wraps · no h-scroll@320)\r
            </Text>\r
            <MantinePopover trigger={<Button variant="default">{t('pop_trigger')}</Button>} title={t('pop_title')}>\r
              {content}\r
            </MantinePopover>\r
          </Stack>\r
\r
          {/* 2 — disabled: trigger tap is a no-op on both paths; no sheet/popover opens */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disabled — trigger tap is a no-op; popover/sheet does NOT open; no focus ring\r
            </Text>\r
            <MantinePopover trigger={<Button variant="default" disabled>{t('pop_trigger')}</Button>} title={t('pop_title')} disabled>\r
              {content}\r
            </MantinePopover>\r
          </Stack>\r
\r
          {/* 3 — icon-only exemption (clause 11): compact at <640, does NOT stretch */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              icon-only trigger (clause-11 exempt) — compact at &lt;640; taps still open the sheet\r
            </Text>\r
            <MantinePopover trigger={<ActionIcon variant="default" aria-label={t('pop_icononly_aria')} mih="2.75rem" miw="2.75rem">\r
                  <MoreVertical size={16} />\r
                </ActionIcon>} title={t('pop_title')} iconOnlyTrigger>\r
              {content}\r
            </MantinePopover>\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(d=i.parameters)===null||d===void 0||(m=d.docs)===null||m===void 0?void 0:m.source}}};const ut=["Default"];export{i as Default,ut as __namedExportsOrder,xt as default};
