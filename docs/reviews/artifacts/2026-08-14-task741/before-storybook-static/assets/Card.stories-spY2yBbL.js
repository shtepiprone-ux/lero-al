import{j as r,B as _,P as g}from"./iframe-BWqC60Cj.js";import{s as y}from"./_storyI18n-DUPbxmag.js";import{M as h}from"./_MantineStoryShell-v1yXHo2n.js";import{S as a}from"./Stack-DqzY2ynC.js";import{T as e}from"./Text-ZiglToyN.js";import{C as o}from"./Card-D7uN-cSx.js";import"./preload-helper-Dp1pzeXC.js";var c,l,m;const v={title:"Mantine/Primitives/Card",parameters:{skipCanvas:!0,layout:"fullscreen"}},s={render:(f,i)=>{var d,n;const x=(n=i==null||(d=i.globals)===null||d===void 0?void 0:d.locale)!==null&&n!==void 0?n:"en",t=p=>y(x,p);return r.jsx(h,{children:r.jsxs(a,{gap:"xl",children:[r.jsxs(a,{gap:"xs",children:[r.jsx(e,{size:"xs",c:"gray.5",fw:500,children:"default card / flat chrome"}),r.jsx(o,{withBorder:!0,children:r.jsxs(a,{gap:"sm",children:[r.jsx(e,{fw:600,children:t("storybook.mantine.card_demo_title")}),r.jsx(e,{size:"sm",c:"gray.7",children:t("storybook.mantine.card_demo_body")}),r.jsx(_,{mih:"2.75rem",w:{base:"100%",sm:"fit-content"},children:t("storybook.mantine.card_demo_action")})]})})]}),r.jsxs(a,{gap:"xs",children:[r.jsx(e,{size:"xs",c:"gray.5",fw:500,children:"paper variant"}),r.jsx(g,{withBorder:!0,p:"lg",children:r.jsxs(a,{gap:"sm",children:[r.jsx(e,{fw:600,children:t("storybook.mantine.card_paper_title")}),r.jsx(e,{size:"sm",c:"gray.7",children:t("storybook.mantine.card_demo_body")})]})})]}),r.jsxs(a,{gap:"xs",children:[r.jsx(e,{size:"xs",c:"gray.5",fw:500,children:"negative flow — no border / nested"}),r.jsx(o,{withBorder:!1,children:r.jsx(e,{size:"sm",c:"gray.7",children:t("storybook.mantine.card_demo_body")})}),r.jsx(o,{withBorder:!0,children:r.jsxs(a,{gap:"sm",children:[r.jsx(e,{fw:600,children:t("storybook.mantine.card_demo_title")}),r.jsx(o,{withBorder:!0,children:r.jsx(e,{size:"sm",c:"gray.7",children:t("storybook.mantine.card_paper_title")})})]})})]})]})})}};s.parameters={...s.parameters,docs:{...(c=s.parameters)===null||c===void 0?void 0:c.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, key);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          {/* Section 1: Content Card — radius-16, 20px padding, gray-1 border, flat (no shadow) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              default card / flat chrome\r
            </Text>\r
            <Card withBorder>\r
              <Stack gap="sm">\r
                <Text fw={600}>{t('storybook.mantine.card_demo_title')}</Text>\r
                <Text size="sm" c="gray.7">{t('storybook.mantine.card_demo_body')}</Text>\r
                <Button mih="2.75rem" w={{
                base: '100%',
                sm: 'fit-content'
              }}>\r
                  {t('storybook.mantine.card_demo_action')}\r
                </Button>\r
              </Stack>\r
            </Card>\r
          </Stack>\r
\r
          {/* Section 2: Paper variant — identical chrome (radius-16, gray-1 border, no shadow) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              paper variant\r
            </Text>\r
            <Paper withBorder p="lg">\r
              <Stack gap="sm">\r
                <Text fw={600}>{t('storybook.mantine.card_paper_title')}</Text>\r
                <Text size="sm" c="gray.7">{t('storybook.mantine.card_demo_body')}</Text>\r
              </Stack>\r
            </Paper>\r
          </Stack>\r
\r
          {/* Section 3: Negative flow */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              negative flow — no border / nested\r
            </Text>\r
            {/* 3a: withBorder=false — no border, but radius+padding tokens still apply */}\r
            <Card withBorder={false}>\r
              <Text size="sm" c="gray.7">{t('storybook.mantine.card_demo_body')}</Text>\r
            </Card>\r
            {/* 3b: Nested Card — no double border/shadow stacking */}\r
            <Card withBorder>\r
              <Stack gap="sm">\r
                <Text fw={600}>{t('storybook.mantine.card_demo_title')}</Text>\r
                <Card withBorder>\r
                  <Text size="sm" c="gray.7">{t('storybook.mantine.card_paper_title')}</Text>\r
                </Card>\r
              </Stack>\r
            </Card>\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(m=s.parameters)===null||m===void 0||(l=m.docs)===null||l===void 0?void 0:l.source}}};const B=["Default"];export{s as Default,B as __namedExportsOrder,v as default};
