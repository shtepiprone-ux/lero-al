import{j as a,G as s,h as p}from"./iframe-BWqC60Cj.js";import{s as _}from"./_storyI18n-DUPbxmag.js";import{M as y}from"./_MantineStoryShell-v1yXHo2n.js";import{S as o}from"./Stack-DqzY2ynC.js";import{T as e}from"./Text-ZiglToyN.js";import{A as t}from"./Avatar-B1u-IzMg.js";import"./preload-helper-Dp1pzeXC.js";var m,d,x;const S={title:"Mantine/Primitives/Avatar",parameters:{skipCanvas:!0,layout:"fullscreen"}},n={render:(b,i)=>{var l,c;const g=(c=i==null||(l=i.globals)===null||l===void 0?void 0:l.locale)!==null&&c!==void 0?c:"en",r=v=>_(g,v);return a.jsx(y,{children:a.jsxs(o,{gap:"xl",children:[a.jsxs(o,{gap:"xs",children:[a.jsx(e,{size:"xs",c:"gray.5",fw:500,children:"image / 40px · 44px"}),a.jsxs(s,{gap:"sm",align:"center",children:[a.jsx(t,{src:"/og-default.png",alt:r("storybook.mantine.avatar_demo_name"),size:40}),a.jsx(t,{src:"/og-default.png",alt:r("storybook.mantine.avatar_demo_name"),size:44})]})]}),a.jsxs(o,{gap:"xs",children:[a.jsx(e,{size:"xs",c:"gray.5",fw:500,children:"initials / 40px · 44px"}),a.jsxs(s,{gap:"sm",align:"center",children:[a.jsx(t,{name:r("storybook.mantine.avatar_demo_name"),color:"brand",size:40}),a.jsx(t,{name:r("storybook.mantine.avatar_demo_name"),color:"brand",size:44})]})]}),a.jsxs(o,{gap:"xs",children:[a.jsx(e,{size:"xs",c:"gray.5",fw:500,children:"composite cell (§6b)"}),a.jsx(p,{w:"100%",children:a.jsxs(s,{gap:"sm",align:"center",wrap:"nowrap",children:[a.jsx(t,{name:r("storybook.mantine.avatar_demo_name"),color:"brand",size:40,style:{flexShrink:0}}),a.jsxs(o,{gap:2,style:{minWidth:0},children:[a.jsx(e,{size:"sm",fw:500,c:"gray.7",children:r("storybook.mantine.avatar_demo_name")}),a.jsx(e,{size:"xs",c:"gray.5",children:r("storybook.mantine.avatar_demo_subtitle")})]})]})})]}),a.jsxs(o,{gap:"xs",children:[a.jsx(e,{size:"xs",c:"gray.5",fw:500,children:"negative flow"}),a.jsxs(s,{gap:"sm",align:"center",children:[a.jsx(t,{size:40,children:"?"}),a.jsx(t,{src:"/not-found-avatar-broken.jpg",name:r("storybook.mantine.avatar_demo_name"),color:"brand",size:40})]}),a.jsx(p,{w:"100%",children:a.jsxs(s,{gap:"sm",align:"center",wrap:"nowrap",children:[a.jsx(t,{name:r("storybook.mantine.avatar_demo_name"),color:"brand",size:40,style:{flexShrink:0}}),a.jsxs(o,{gap:2,style:{minWidth:0},children:[a.jsx(e,{size:"sm",fw:500,c:"gray.7",style:{overflowWrap:"break-word"},children:r("storybook.mantine.avatar_demo_name")}),a.jsx(e,{size:"xs",c:"gray.5",style:{overflowWrap:"break-word"},children:r("storybook.mantine.avatar_demo_subtitle")})]})]})})]})]})})}};n.parameters={...n.parameters,docs:{...(m=n.parameters)===null||m===void 0?void 0:m.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, key);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          {/* Section 1: Image avatar — 40px and 44px, photo cropped to circle */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              image / 40px · 44px\r
            </Text>\r
            <Group gap="sm" align="center">\r
              <Avatar src="/og-default.png" alt={t('storybook.mantine.avatar_demo_name')} size={40} />\r
              <Avatar src="/og-default.png" alt={t('storybook.mantine.avatar_demo_name')} size={44} />\r
            </Group>\r
          </Stack>\r
\r
          {/* Section 2: Initials fallback — brand-tinted circle, uppercase initials, 40px and 44px */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              initials / 40px · 44px\r
            </Text>\r
            <Group gap="sm" align="center">\r
              <Avatar name={t('storybook.mantine.avatar_demo_name')} color="brand" size={40} />\r
              <Avatar name={t('storybook.mantine.avatar_demo_name')} color="brand" size={44} />\r
            </Group>\r
          </Stack>\r
\r
          {/* Section 3: Composite user cell (§6b) — avatar + name + subtitle, full-width container at <640 */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              composite cell (§6b)\r
            </Text>\r
            <Box w="100%">\r
              <Group gap="sm" align="center" wrap="nowrap">\r
                <Avatar name={t('storybook.mantine.avatar_demo_name')} color="brand" size={40} style={{
                flexShrink: 0
              }} />\r
                <Stack gap={2} style={{
                minWidth: 0
              }}>\r
                  <Text size="sm" fw={500} c="gray.7">\r
                    {t('storybook.mantine.avatar_demo_name')}\r
                  </Text>\r
                  <Text size="xs" c="gray.5">\r
                    {t('storybook.mantine.avatar_demo_subtitle')}\r
                  </Text>\r
                </Stack>\r
              </Group>\r
            </Box>\r
          </Stack>\r
\r
          {/* Section 4: Negative flow */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              negative flow\r
            </Text>\r
            <Group gap="sm" align="center">\r
              {/* 4a: no name / no src → graceful placeholder (children="?"), no crash, no raw color */}\r
              <Avatar size={40}>?</Avatar>\r
              {/* 4b: broken src → Mantine falls back to initials derived from name, no broken-image glyph */}\r
              <Avatar src="/not-found-avatar-broken.jpg" name={t('storybook.mantine.avatar_demo_name')} color="brand" size={40} />\r
            </Group>\r
            {/* 4c: long uk name — locale=uk avatar_demo_name="Олена Коваленко" → "ОК" initials;\r
                composite cell below — text wraps at 320, no clip or h-scroll */}\r
            <Box w="100%">\r
              <Group gap="sm" align="center" wrap="nowrap">\r
                <Avatar name={t('storybook.mantine.avatar_demo_name')} color="brand" size={40} style={{
                flexShrink: 0
              }} />\r
                <Stack gap={2} style={{
                minWidth: 0
              }}>\r
                  <Text size="sm" fw={500} c="gray.7" style={{
                  overflowWrap: 'break-word'
                }}>\r
                    {t('storybook.mantine.avatar_demo_name')}\r
                  </Text>\r
                  <Text size="xs" c="gray.5" style={{
                  overflowWrap: 'break-word'
                }}>\r
                    {t('storybook.mantine.avatar_demo_subtitle')}\r
                  </Text>\r
                </Stack>\r
              </Group>\r
            </Box>\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(x=n.parameters)===null||x===void 0||(d=x.docs)===null||d===void 0?void 0:d.source}}};const T=["Default"];export{n as Default,T as __namedExportsOrder,S as default};
