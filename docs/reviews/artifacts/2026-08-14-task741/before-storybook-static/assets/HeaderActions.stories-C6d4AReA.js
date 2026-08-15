import{j as e}from"./iframe-BWqC60Cj.js";import{s as u}from"./_storyI18n-DUPbxmag.js";import{H as m}from"./HeaderActions-CNT8cKd_.js";import{M as _}from"./_MantineStoryShell-v1yXHo2n.js";import{A as x}from"./ActionIcon-BlvdNdEl.js";import{B as v}from"./bell-DMa8CuzC.js";import{S as i}from"./Stack-DqzY2ynC.js";import{T as h}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./index-C8MEBqML.js";import"./index-PXfbuUw3.js";import"./heart-D83DUq8K.js";import"./createLucideIcon-DZTr3VOw.js";var l,c,d;const E={title:"Mantine/Primitives/HeaderActions",parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Title under `Mantine/Primitives/` (Task 575 correction, owner 2026-07-11): the rendered-assert\r\nharness (`scripts/check-stories-rendered.mjs`) only gives PERMANENT, standing enforcement under\r\n`--mantine-only` to stories whose title matches this exact prefix — same rationale as\r\n`FiltersPanelShell`/`PhoneField`. `HeaderActions` is app-shell layout, not a design-system\r\nprimitive, but this title is a display-grouping choice for gate enforcement, not a taxonomy claim.\r\n\n`HeaderActions` is NOT in the harness's `MANTINE_OVERLAY_PRIMITIVES` open-trigger set, so it\r\nrenders inline with no auto-click needed — both fixture states are always visible for capture."}}}},t={render:(g,r)=>{var a,n;const s=(n=r==null||(a=r.globals)===null||a===void 0?void 0:a.locale)!==null&&n!==void 0?n:"en",o=f=>u(s,`storybook.mantine.${f}`),p=e.jsx(x,{variant:"subtle",mih:"2.75rem",miw:"2.75rem","aria-label":o("header_actions_bell_slot_aria"),children:e.jsx(v,{className:"size-5"})});return e.jsx(_,{children:e.jsxs(i,{gap:"xl",children:[e.jsxs(i,{gap:"xs",children:[e.jsx(h,{size:"xs",c:"gray.5",fw:500,children:o("header_actions_guest_caption")}),e.jsx(m,{isAuthenticated:!1,favoritesHref:`/${s}/favorites`,onOpenAuth:()=>{}})]}),e.jsxs(i,{gap:"xs",children:[e.jsx(h,{size:"xs",c:"gray.5",fw:500,children:o("header_actions_authed_caption")}),e.jsx(m,{isAuthenticated:!0,favoritesHref:`/${s}/favorites`,onOpenAuth:()=>{},notificationSlot:p})]})]})})}};t.parameters={...t.parameters,docs:{...(l=t.parameters)===null||l===void 0?void 0:l.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);

    // Placeholder standing in for the real NotificationBell (which owns its own hooks and is
    // dynamic ssr:false in the app) — the story only proves the slot is rendered, never hook-calls
    // the real bell (Sprint 44 plan STOP-AND-ASK #1).
    const bellPlaceholder = <ActionIcon variant="subtle" mih="2.75rem" miw="2.75rem" aria-label={t('header_actions_bell_slot_aria')}>\r
        <Bell className="size-5" />\r
      </ActionIcon>;
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              {t('header_actions_guest_caption')}\r
            </Text>\r
            <HeaderActions isAuthenticated={false} favoritesHref={\`/\${locale}/favorites\`} onOpenAuth={() => {}} />\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              {t('header_actions_authed_caption')}\r
            </Text>\r
            <HeaderActions isAuthenticated favoritesHref={\`/\${locale}/favorites\`} onOpenAuth={() => {}} notificationSlot={bellPlaceholder} />\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(d=t.parameters)===null||d===void 0||(c=d.docs)===null||c===void 0?void 0:c.source}}};const I=["Default"];export{t as Default,I as __namedExportsOrder,E as default};
