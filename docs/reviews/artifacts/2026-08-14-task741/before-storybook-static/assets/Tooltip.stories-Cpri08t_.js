import{j as t,G as b}from"./iframe-BWqC60Cj.js";import{s as u}from"./_storyI18n-DUPbxmag.js";import{m as r}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{M as _}from"./_MantineStoryShell-v1yXHo2n.js";import{S as a}from"./Stack-DqzY2ynC.js";import{T as m}from"./Text-ZiglToyN.js";import{A as i}from"./ActionIcon-BlvdNdEl.js";import{I as e}from"./triangle-alert-DixzZ8YV.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./octagon-x-CIwru5Ci.js";import"./createLucideIcon-DZTr3VOw.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var c,h,d;const dt={title:"Mantine/Primitives/Tooltip",parameters:{skipCanvas:!0,layout:"fullscreen"}},l={render:(x,n)=>{var s,p;const f=(p=n==null||(s=n.globals)===null||s===void 0?void 0:s.locale)!==null&&p!==void 0?p:"en",o=g=>u(f,`storybook.mantine.${g}`);return t.jsx(_,{children:t.jsxs(a,{gap:"xl",children:[t.jsxs(a,{gap:"xs",children:[t.jsx(m,{size:"xs",c:"gray.5",fw:500,children:"standard info tooltip — hover/focus (≥640) shows the anchored §6k tooltip; tap (<640) opens the full-width bottom sheet with the label"}),t.jsx(r,{label:o("tooltip_label"),children:t.jsx(i,{variant:"default","aria-label":o("tooltip_trigger_aria"),mih:"2.75rem",miw:"2.75rem",children:t.jsx(e,{size:16})})})]}),t.jsxs(a,{gap:"xs",children:[t.jsx(m,{size:"xs",c:"gray.5",fw:500,children:"long-uk label — wraps inside the full-width sheet at 320 (no clip, no h-scroll); ≥640 tooltip wraps within max-width"}),t.jsx(r,{label:o("tooltip_long_label"),children:t.jsx(i,{variant:"default","aria-label":o("tooltip_trigger_aria"),mih:"2.75rem",miw:"2.75rem",children:t.jsx(e,{size:16})})})]}),t.jsxs(a,{gap:"xs",children:[t.jsx(m,{size:"xs",c:"gray.5",fw:500,children:"placement variants (top · right · bottom · left) — ≥640 anchors on the corresponding side; <640 STILL the SAME full-width bottom sheet for every trigger (position ignored)"}),t.jsxs(b,{gap:"md",justify:"space-between",w:"100%",children:[t.jsx(r,{label:o("tooltip_label"),position:"top",children:t.jsx(i,{variant:"default","aria-label":o("tooltip_trigger_aria"),mih:"2.75rem",miw:"2.75rem",children:t.jsx(e,{size:16})})}),t.jsx(r,{label:o("tooltip_label"),position:"right",children:t.jsx(i,{variant:"default","aria-label":o("tooltip_right_trigger_aria"),mih:"2.75rem",miw:"2.75rem",children:t.jsx(e,{size:16})})}),t.jsx(r,{label:o("tooltip_label"),position:"bottom",children:t.jsx(i,{variant:"default","aria-label":o("tooltip_bottom_trigger_aria"),mih:"2.75rem",miw:"2.75rem",children:t.jsx(e,{size:16})})}),t.jsx(r,{label:o("tooltip_label"),position:"left",children:t.jsx(i,{variant:"default","aria-label":o("tooltip_left_trigger_aria"),mih:"2.75rem",miw:"2.75rem",children:t.jsx(e,{size:16})})})]})]})]})})}};l.parameters={...l.parameters,docs:{...(c=l.parameters)===null||c===void 0?void 0:c.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* 1 — standard info tooltip: hover/focus ≥640 anchored §6k tooltip; tap <640\r
              opens the full-width bottom sheet with the label. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              standard info tooltip — hover/focus (≥640) shows the anchored §6k tooltip; tap (&lt;640) opens the full-width bottom sheet with the label\r
            </Text>\r
            <MantineTooltip label={t('tooltip_label')}>\r
              <ActionIcon variant="default" aria-label={t('tooltip_trigger_aria')} mih="2.75rem" miw="2.75rem">\r
                <Info size={16} />\r
              </ActionIcon>\r
            </MantineTooltip>\r
          </Stack>\r
\r
          {/* 2 — long-uk label: proves wrap inside the full-width sheet at 320 (no clip,\r
              no h-scroll) and a sane max-width on the ≥640 anchored tooltip. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              long-uk label — wraps inside the full-width sheet at 320 (no clip, no h-scroll); ≥640 tooltip wraps within max-width\r
            </Text>\r
            <MantineTooltip label={t('tooltip_long_label')}>\r
              <ActionIcon variant="default" aria-label={t('tooltip_trigger_aria')} mih="2.75rem" miw="2.75rem">\r
                <Info size={16} />\r
              </ActionIcon>\r
            </MantineTooltip>\r
          </Stack>\r
\r
          {/* 3 — placement variants: proves ALL FOUR desktop positions (Top · Right ·\r
              Bottom · Left, owner feedback 2026-07-02 — right/left were missing) while\r
              <640 STILL collapses to the SAME bottom sheet for every one (position\r
              has no effect there). Top is already proven by section 1's default. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              placement variants (top · right · bottom · left) — ≥640 anchors on the corresponding side; &lt;640 STILL the SAME full-width bottom sheet for every trigger (position ignored)\r
            </Text>\r
            {/* justify="space-between" + full width: the \`right\`-anchored trigger needs\r
                room to its right and the \`left\`-anchored trigger needs room to its left\r
                for Floating-UI to actually render them there instead of auto-flipping\r
                when space is insufficient (Task 526 — verified via rendered\r
                measurement, not assumed; a single flex-end/flex-start group starves\r
                one side or the other). */}\r
            <Group gap="md" justify="space-between" w="100%">\r
              <MantineTooltip label={t('tooltip_label')} position="top">\r
                <ActionIcon variant="default" aria-label={t('tooltip_trigger_aria')} mih="2.75rem" miw="2.75rem">\r
                  <Info size={16} />\r
                </ActionIcon>\r
              </MantineTooltip>\r
              <MantineTooltip label={t('tooltip_label')} position="right">\r
                <ActionIcon variant="default" aria-label={t('tooltip_right_trigger_aria')} mih="2.75rem" miw="2.75rem">\r
                  <Info size={16} />\r
                </ActionIcon>\r
              </MantineTooltip>\r
              <MantineTooltip label={t('tooltip_label')} position="bottom">\r
                <ActionIcon variant="default" aria-label={t('tooltip_bottom_trigger_aria')} mih="2.75rem" miw="2.75rem">\r
                  <Info size={16} />\r
                </ActionIcon>\r
              </MantineTooltip>\r
              <MantineTooltip label={t('tooltip_label')} position="left">\r
                <ActionIcon variant="default" aria-label={t('tooltip_left_trigger_aria')} mih="2.75rem" miw="2.75rem">\r
                  <Info size={16} />\r
                </ActionIcon>\r
              </MantineTooltip>\r
            </Group>\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(d=l.parameters)===null||d===void 0||(h=d.docs)===null||h===void 0?void 0:h.source}}};const ft=["Default"];export{l as Default,ft as __namedExportsOrder,dt as default};
