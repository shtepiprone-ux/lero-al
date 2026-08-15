import{j as t,N as i}from"./iframe-BWqC60Cj.js";import{s as m}from"./_storyI18n-DUPbxmag.js";import{M as d}from"./_MantineStoryShell-v1yXHo2n.js";import{S as g}from"./Stack-DqzY2ynC.js";import{C as h}from"./circle-check-CnzcspZt.js";import{I as p,T as w}from"./triangle-alert-DixzZ8YV.js";import{O as x}from"./octagon-x-CIwru5Ci.js";import"./preload-helper-Dp1pzeXC.js";import"./createLucideIcon-DZTr3VOw.js";var l,c,_;const O={title:"Mantine/Primitives/Notification",parameters:{skipCanvas:!0,layout:"fullscreen"}},e=24,r={render:(y,n)=>{var a,s;const f=(s=n==null||(a=n.globals)===null||a===void 0?void 0:a.locale)!==null&&s!==void 0?s:"en",o=u=>m(f,`storybook.mantine.${u}`);return t.jsx(d,{children:t.jsxs(g,{gap:"md",children:[t.jsx(i,{color:"green",icon:t.jsx(h,{size:e}),title:o("notification_success_title"),withCloseButton:!0,children:o("notification_success_message")}),t.jsx(i,{color:"blueLight",icon:t.jsx(p,{size:e}),title:o("notification_info_title"),withCloseButton:!0,children:o("notification_info_message")}),t.jsx(i,{color:"yellow",icon:t.jsx(w,{size:e}),title:o("notification_warning_title"),withCloseButton:!0,children:o("notification_warning_message")}),t.jsx(i,{color:"red",icon:t.jsx(x,{size:e}),title:o("notification_error_title"),withCloseButton:!0,children:o("notification_error_message")}),t.jsx(i,{color:"gray",title:o("notification_neutral_title"),withCloseButton:!0,children:o("notification_neutral_message")})]})})}};r.parameters={...r.parameters,docs:{...(l=r.parameters)===null||l===void 0?void 0:l.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="md">\r
\r
          {/* Static/determinate — no notifications.show() call (that's a portal with an auto-close\r
              timer + enter/leave transition, not byte-stable). Each state renders a <Notification>\r
              directly, matching §6r-LIVE (Task 550 correction): 6px radius, shadow-theme-sm, a 4px\r
              BOTTOM-border semantic accent (not a left bar), a 40×40 rounded-lg semantic-50 icon\r
              badge with a semantic-600 glyph, 16px/400 title, full-width <640 / max-width 340px\r
              ≥640. */}\r
\r
          <Notification color="green" icon={<CircleCheckIcon size={ICON_SIZE} />} title={t('notification_success_title')} withCloseButton>\r
            {t('notification_success_message')}\r
          </Notification>\r
\r
          <Notification color="blueLight" icon={<InfoIcon size={ICON_SIZE} />} title={t('notification_info_title')} withCloseButton>\r
            {t('notification_info_message')}\r
          </Notification>\r
\r
          <Notification color="yellow" icon={<TriangleAlertIcon size={ICON_SIZE} />} title={t('notification_warning_title')} withCloseButton>\r
            {t('notification_warning_message')}\r
          </Notification>\r
\r
          <Notification color="red" icon={<OctagonXIcon size={ICON_SIZE} />} title={t('notification_error_title')} withCloseButton>\r
            {t('notification_error_message')}\r
          </Notification>\r
\r
          {/* Neutral/default — no icon (matches legacy sonner.tsx's icon-less default toast), gray\r
              accent instead of a semantic color — §6r-LIVE "no semantic accent" (b): the bottom\r
              border still renders (theme.ts styles.root applies unconditionally) but in a neutral\r
              gray-500 tone, never a success/info/warning/error color. */}\r
          <Notification color="gray" title={t('notification_neutral_title')} withCloseButton>\r
            {t('notification_neutral_message')}\r
          </Notification>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(_=r.parameters)===null||_===void 0||(c=_.docs)===null||c===void 0?void 0:c.source}}};const E=["Default"];export{r as Default,E as __namedExportsOrder,O as default};
