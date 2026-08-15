import{j as t,B as m}from"./iframe-BWqC60Cj.js";import{s as h}from"./_storyI18n-DUPbxmag.js";import{M as i}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{M as x}from"./_MantineStoryShell-v1yXHo2n.js";import{S as r}from"./Stack-DqzY2ynC.js";import{T as o}from"./Text-ZiglToyN.js";import{A as b}from"./ActionIcon-BlvdNdEl.js";import{E as f}from"./ellipsis-vertical-CZebx50N.js";import{C as k}from"./chevron-down-B9O36-Ph.js";import{c as v}from"./createLucideIcon-DZTr3VOw.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";/**
 * @license lucide-react v1.16.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],y=v("globe",w);var d,p,g;const kt={title:"Mantine/Primitives/DropdownMenu",parameters:{skipCanvas:!0,layout:"fullscreen"}},a={render:(S,l)=>{var n,s;const _=(s=l==null||(n=l.globals)===null||n===void 0?void 0:n.locale)!==null&&s!==void 0?s:"en",e=u=>h(_,`storybook.mantine.${u}`),c=[{label:e("dm_item_view"),onClick:()=>{}},{label:e("dm_item_edit"),onClick:()=>{}},{label:e("dm_item_archive"),onClick:()=>{}},{label:e("dm_item_delete"),onClick:()=>{},color:"red",separator:!0}];return t.jsx(x,{children:t.jsxs(r,{gap:"xl",children:[t.jsxs(r,{gap:"xs",children:[t.jsx(o,{size:"xs",c:"gray.5",fw:500,children:"trigger (closed/resting) — click trigger to open; ≥640: anchored Mantine Menu; <640: full-width bottom sheet (drag handle · ≥44px rows · long uk wraps · no h-scroll@320)"}),t.jsx(i,{trigger:t.jsx(m,{variant:"default",children:e("dm_trigger")}),title:e("dm_title"),items:c})]}),t.jsxs(r,{gap:"xs",children:[t.jsx(o,{size:"xs",c:"gray.5",fw:500,children:"disabled — trigger tap is a no-op; menu/sheet does NOT open"}),t.jsx(i,{trigger:t.jsx(m,{variant:"default",disabled:!0,children:e("dm_trigger")}),title:e("dm_title"),items:c,disabled:!0})]}),t.jsxs(r,{gap:"xs",children:[t.jsx(o,{size:"xs",c:"gray.5",fw:500,children:"icon-only trigger (clause-11 exempt) — compact at <640; taps still open the sheet"}),t.jsx(i,{trigger:t.jsx(b,{variant:"default","aria-label":e("dm_icononly_aria"),mih:"2.75rem",miw:"2.75rem",children:t.jsx(f,{size:16})}),title:e("dm_title"),items:c,iconOnlyTrigger:!0})]}),t.jsxs(r,{gap:"xs",children:[t.jsx(o,{size:"xs",c:"gray.5",fw:500,children:e("dm_locale_caption")}),t.jsx(i,{trigger:t.jsx(m,{variant:"default",leftSection:t.jsx(y,{size:16}),rightSection:t.jsx(k,{size:16}),children:"SQ"}),items:[{label:`SQ ${e("dm_locale_name_sq")}`,onClick:()=>{}},{label:`EN ${e("dm_locale_name_en")}`,onClick:()=>{}},{label:`UA ${e("dm_locale_name_uk")}`,onClick:()=>{}},{label:`IT ${e("dm_locale_name_it")}`,onClick:()=>{}}]})]})]})})}};a.parameters={...a.parameters,docs:{...(d=a.parameters)===null||d===void 0?void 0:d.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    const items: DropdownMenuItemDef[] = [{
      label: t('dm_item_view'),
      onClick: () => {}
    }, {
      label: t('dm_item_edit'),
      onClick: () => {}
    }, {
      label: t('dm_item_archive'),
      onClick: () => {}
    }, {
      label: t('dm_item_delete'),
      onClick: () => {},
      color: 'red',
      separator: true
    }];
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* 1 — trigger (closed/resting): click trigger to open\r
              at ≥640 → anchored Mantine Menu; at <640 → full-width bottom sheet\r
              Use the toolbar viewport switcher to verify both paths on this ONE section. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              trigger (closed/resting) — click trigger to open; ≥640: anchored Mantine Menu; &lt;640: full-width bottom sheet (drag handle · ≥44px rows · long uk wraps · no h-scroll@320)\r
            </Text>\r
            <MantineDropdownMenu trigger={<Button variant="default">{t('dm_trigger')}</Button>} title={t('dm_title')} items={items} />\r
          </Stack>\r
\r
          {/* 2 — disabled: trigger tap is a no-op on both paths */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disabled — trigger tap is a no-op; menu/sheet does NOT open\r
            </Text>\r
            <MantineDropdownMenu trigger={<Button variant="default" disabled>{t('dm_trigger')}</Button>} title={t('dm_title')} items={items} disabled />\r
          </Stack>\r
\r
          {/* 3 — icon-only exemption (clause 11): compact at <640, does NOT stretch */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              icon-only trigger (clause-11 exempt) — compact at &lt;640; taps still open the sheet\r
            </Text>\r
            <MantineDropdownMenu trigger={<ActionIcon variant="default" aria-label={t('dm_icononly_aria')} mih="2.75rem" miw="2.75rem">\r
                  <MoreVertical size={16} />\r
                </ActionIcon>} title={t('dm_title')} items={items} iconOnlyTrigger />\r
          </Stack>\r
\r
          {/* 4 — locale-switcher abbreviation trigger (Task 574 §0, owner 2026-07-11): the exact\r
              trigger construction the Header's LocaleSwitcher will consume. COPIED from example 1's\r
              Button-trigger + storyT + caption construction — zero invented className/style/size/color.\r
              Globe/ChevronDown live in Mantine's own leftSection/rightSection slots; the abbreviation\r
              is the Button's plain children. variant="default" chrome IS the entire styling. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              {t('dm_locale_caption')}\r
            </Text>\r
            <MantineDropdownMenu trigger={<Button variant="default" leftSection={<Globe size={16} />} rightSection={<ChevronDown size={16} />}>\r
                  SQ\r
                </Button>} items={[{
            label: \`SQ \${t('dm_locale_name_sq')}\`,
            onClick: () => {}
          }, {
            label: \`EN \${t('dm_locale_name_en')}\`,
            onClick: () => {}
          }, {
            label: \`UA \${t('dm_locale_name_uk')}\`,
            onClick: () => {}
          }, {
            label: \`IT \${t('dm_locale_name_it')}\`,
            onClick: () => {}
          }]} />\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(g=a.parameters)===null||g===void 0||(p=g.docs)===null||p===void 0?void 0:p.source}}};const vt=["Default"];export{a as Default,vt as __namedExportsOrder,kt as default};
