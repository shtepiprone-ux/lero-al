import{j as r}from"./iframe-BWqC60Cj.js";import{s as p}from"./_storyI18n-DUPbxmag.js";import{M as f}from"./_MantineStoryShell-v1yXHo2n.js";import{S as l}from"./Stack-DqzY2ynC.js";import{T as s}from"./Text-ZiglToyN.js";import{A as t}from"./Alert-CdAug_hS.js";import{C as x}from"./circle-check-CnzcspZt.js";import{T as h,I as w}from"./triangle-alert-DixzZ8YV.js";import{C as m}from"./circle-x-DcKQfgdG.js";import"./preload-helper-Dp1pzeXC.js";import"./createLucideIcon-DZTr3VOw.js";var n,_,g;const M={title:"Mantine/Primitives/Alert",parameters:{skipCanvas:!0,layout:"fullscreen"}},o={render:(j,i)=>{var a,c;const d=(c=i==null||(a=i.globals)===null||a===void 0?void 0:a.locale)!==null&&c!==void 0?c:"en",e=u=>p(d,`storybook.mantine.${u}`);return r.jsx(f,{children:r.jsxs(l,{gap:"xl",children:[r.jsxs(l,{gap:"xs",children:[r.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"success / warning / error / info — 12px radius, 1px border semantic-500, bg semantic-50"}),r.jsxs(l,{gap:"md",children:[r.jsx(t,{color:"green",icon:r.jsx(x,{size:20}),title:e("alert_success_title"),children:e("alert_success_msg")}),r.jsx(t,{color:"yellow",icon:r.jsx(h,{size:20}),title:e("alert_warning_title"),children:e("alert_warning_msg")}),r.jsx(t,{color:"red",icon:r.jsx(m,{size:20}),title:e("alert_error_title"),children:e("alert_error_msg")}),r.jsx(t,{color:"blueLight",icon:r.jsx(w,{size:20}),title:e("alert_info_title"),children:e("alert_info_msg")})]})]}),r.jsxs(l,{gap:"xs",children:[r.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"withCloseButton — dismiss control"}),r.jsx(t,{color:"green",icon:r.jsx(x,{size:20}),title:e("alert_success_title"),withCloseButton:!0,closeButtonLabel:e("alert_close_aria"),onClose:()=>{},children:e("alert_success_msg")})]}),r.jsxs(l,{gap:"xs",children:[r.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"icon-less — body flush-left"}),r.jsx(t,{color:"yellow",title:e("alert_iconless_title"),children:e("alert_iconless_msg")})]}),r.jsxs(l,{gap:"xs",children:[r.jsx(s,{size:"xs",c:"gray.5",fw:500,children:"long content — wraps, no clip, no h-scroll@320"}),r.jsx(t,{color:"red",icon:r.jsx(m,{size:20}),title:e("alert_long_title"),children:e("alert_long_msg")})]})]})})}};o.parameters={...o.parameters,docs:{...(n=o.parameters)===null||n===void 0?void 0:n.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* ── four semantic variants — §6l Alerts chrome ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              success / warning / error / info — 12px radius, 1px border semantic-500, bg semantic-50\r
            </Text>\r
            <Stack gap="md">\r
              <Alert color="green" icon={<CircleCheck size={20} />} title={t('alert_success_title')}>\r
                {t('alert_success_msg')}\r
              </Alert>\r
              <Alert color="yellow" icon={<TriangleAlert size={20} />} title={t('alert_warning_title')}>\r
                {t('alert_warning_msg')}\r
              </Alert>\r
              <Alert color="red" icon={<CircleX size={20} />} title={t('alert_error_title')}>\r
                {t('alert_error_msg')}\r
              </Alert>\r
              <Alert color="blueLight" icon={<Info size={20} />} title={t('alert_info_title')}>\r
                {t('alert_info_msg')}\r
              </Alert>\r
            </Stack>\r
          </Stack>\r
\r
          {/* ── withCloseButton — dismiss control, ≥44px tappable ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              withCloseButton — dismiss control\r
            </Text>\r
            <Alert color="green" icon={<CircleCheck size={20} />} title={t('alert_success_title')} withCloseButton closeButtonLabel={t('alert_close_aria')} onClose={() => {}}>\r
              {t('alert_success_msg')}\r
            </Alert>\r
          </Stack>\r
\r
          {/* ── icon-less — body flush-left, no reserved icon gutter ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              icon-less — body flush-left\r
            </Text>\r
            <Alert color="yellow" title={t('alert_iconless_title')}>\r
              {t('alert_iconless_msg')}\r
            </Alert>\r
          </Stack>\r
\r
          {/* ── long content — negative flow: wrap, no clip, no h-scroll@320 (uk longest) ── */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              long content — wraps, no clip, no h-scroll@320\r
            </Text>\r
            <Alert color="red" icon={<CircleX size={20} />} title={t('alert_long_title')}>\r
              {t('alert_long_msg')}\r
            </Alert>\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(g=o.parameters)===null||g===void 0||(_=g.docs)===null||_===void 0?void 0:_.source}}};const L=["Default"];export{o as Default,L as __namedExportsOrder,M as default};
