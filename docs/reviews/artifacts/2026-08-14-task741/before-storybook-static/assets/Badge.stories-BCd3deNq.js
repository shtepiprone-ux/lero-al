import{j as a,G as t}from"./iframe-BWqC60Cj.js";import{s as _}from"./_storyI18n-DUPbxmag.js";import{M as u}from"./_MantineStoryShell-v1yXHo2n.js";import{S as o}from"./Stack-DqzY2ynC.js";import{T as n}from"./Text-ZiglToyN.js";import{B as r}from"./Badge-tZlP7Rz3.js";import"./preload-helper-Dp1pzeXC.js";var c,g,m;const w={title:"Mantine/Primitives/Badge",parameters:{skipCanvas:!0,layout:"fullscreen"}},s={render:(y,i)=>{var l,d;const b=(d=i==null||(l=i.globals)===null||l===void 0?void 0:l.locale)!==null&&d!==void 0?d:"en",e=p=>_(b,p);return a.jsx(u,{children:a.jsxs(o,{gap:"lg",children:[a.jsxs(o,{gap:"xs",children:[a.jsx(n,{size:"xs",c:"gray.5",fw:500,children:e("storybook.mantine.admin_table_col_status")}),a.jsxs(t,{gap:"xs",children:[a.jsx(r,{color:"green",children:e("storybook.mantine.admin_status_active")}),a.jsx(r,{color:"yellow",children:e("storybook.mantine.admin_status_pending")}),a.jsx(r,{color:"red",children:e("storybook.mantine.badge_blocked")}),a.jsx(r,{color:"gray",children:e("storybook.mantine.admin_status_archived")}),a.jsx(r,{color:"brand",children:e("storybook.mantine.badge_brand")}),a.jsx(r,{color:"blueLight",children:e("storybook.mantine.badge_info")}),a.jsx(r,{color:"purple",children:e("storybook.mantine.badge_purple")}),a.jsx(r,{color:"sale",children:e("storybook.mantine.badge_sale")})]})]}),a.jsxs(o,{gap:"xs",children:[a.jsx(n,{size:"xs",c:"gray.5",fw:500,children:"xs / sm (default)"}),a.jsxs(t,{gap:"xs",align:"center",children:[a.jsx(r,{color:"green",size:"xs",children:e("storybook.mantine.admin_status_active")}),a.jsx(r,{color:"green",size:"sm",children:e("storybook.mantine.admin_status_active")})]})]}),a.jsxs(o,{gap:"xs",children:[a.jsx(n,{size:"xs",c:"gray.5",fw:500,children:"long label / no clip"}),a.jsxs(t,{gap:"xs",children:[a.jsx(r,{color:"red",children:e("storybook.mantine.badge_blocked")}),a.jsx(r,{color:"yellow",children:e("storybook.mantine.admin_status_pending")}),a.jsx(r,{color:"gray",children:e("storybook.mantine.admin_status_archived")})]})]}),a.jsxs(o,{gap:"xs",children:[a.jsx(n,{size:"xs",c:"gray.5",fw:500,children:e("storybook.mantine.badge_filled_caption")}),a.jsxs(t,{gap:"xs",p:"md",style:{backgroundColor:"var(--mantine-color-gray-3)",borderRadius:"var(--mantine-radius-lg)"},children:[a.jsx(r,{variant:"filled",color:"green",children:e("storybook.mantine.admin_status_active")}),a.jsx(r,{variant:"filled",color:"yellow",children:e("storybook.mantine.admin_status_pending")}),a.jsx(r,{variant:"filled",color:"red",children:e("storybook.mantine.badge_blocked")}),a.jsx(r,{variant:"filled",color:"gray",children:e("storybook.mantine.admin_status_archived")}),a.jsx(r,{variant:"filled",color:"brand",children:e("storybook.mantine.badge_brand")}),a.jsx(r,{variant:"filled",color:"blueLight",children:e("storybook.mantine.badge_info")}),a.jsx(r,{variant:"filled",color:"purple",children:e("storybook.mantine.badge_purple")}),a.jsx(r,{variant:"filled",color:"sale",children:e("storybook.mantine.badge_sale")})]})]})]})})}};s.parameters={...s.parameters,docs:{...(c=s.parameters)===null||c===void 0?void 0:c.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, key);
    return <MantineStoryShell>\r
        <Stack gap="lg">\r
          {/* Semantic status variants */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              {t('storybook.mantine.admin_table_col_status')}\r
            </Text>\r
            <Group gap="xs">\r
              <Badge color="green">{t('storybook.mantine.admin_status_active')}</Badge>\r
              <Badge color="yellow">{t('storybook.mantine.admin_status_pending')}</Badge>\r
              <Badge color="red">{t('storybook.mantine.badge_blocked')}</Badge>\r
              <Badge color="gray">{t('storybook.mantine.admin_status_archived')}</Badge>\r
              <Badge color="brand">{t('storybook.mantine.badge_brand')}</Badge>\r
              {/* Task 617 — added for MantineListingCardPattern's sold/rented status badges\r
                  (globals.css --status-info / --status-rented have no prior Mantine color). */}\r
              <Badge color="blueLight">{t('storybook.mantine.badge_info')}</Badge>\r
              <Badge color="purple">{t('storybook.mantine.badge_purple')}</Badge>\r
              {/* Task 619 — dedicated price-reduced crimson (owner-provided #dd0939), distinct\r
                  from both \`brand\` (coral) and \`red\` (error/Blocked). */}\r
              <Badge color="sale">{t('storybook.mantine.badge_sale')}</Badge>\r
            </Group>\r
          </Stack>\r
\r
          {/* Size comparison: xs vs sm (theme default) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              xs / sm (default)\r
            </Text>\r
            <Group gap="xs" align="center">\r
              <Badge color="green" size="xs">{t('storybook.mantine.admin_status_active')}</Badge>\r
              <Badge color="green" size="sm">{t('storybook.mantine.admin_status_active')}</Badge>\r
            </Group>\r
          </Stack>\r
\r
          {/* Negative flow: long uk label ("Заблокований") — no clip at 320px */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              long label / no clip\r
            </Text>\r
            <Group gap="xs">\r
              <Badge color="red">{t('storybook.mantine.badge_blocked')}</Badge>\r
              <Badge color="yellow">{t('storybook.mantine.admin_status_pending')}</Badge>\r
              <Badge color="gray">{t('storybook.mantine.admin_status_archived')}</Badge>\r
            </Group>\r
          </Stack>\r
\r
          {/* Task 617 — \`variant="filled"\` (opaque, solid background + white text). The theme\r
              default \`variant="light"\` (all sections above) mixes a translucent tint, which reads\r
              poorly when a badge sits directly on top of a photo (e.g. MantineListingCardPattern's\r
              corner status badges) — the underlying image can bleed through and kill contrast.\r
              \`filled\` has no transparency, so it stays legible over any photo. Demoed on a gray\r
              swatch below to make the "sits on a photo" case visible even in this plain story. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              {t('storybook.mantine.badge_filled_caption')}\r
            </Text>\r
            <Group gap="xs" p="md" style={{
            backgroundColor: 'var(--mantine-color-gray-3)',
            borderRadius: 'var(--mantine-radius-lg)'
          }}>\r
              <Badge variant="filled" color="green">{t('storybook.mantine.admin_status_active')}</Badge>\r
              <Badge variant="filled" color="yellow">{t('storybook.mantine.admin_status_pending')}</Badge>\r
              <Badge variant="filled" color="red">{t('storybook.mantine.badge_blocked')}</Badge>\r
              <Badge variant="filled" color="gray">{t('storybook.mantine.admin_status_archived')}</Badge>\r
              <Badge variant="filled" color="brand">{t('storybook.mantine.badge_brand')}</Badge>\r
              <Badge variant="filled" color="blueLight">{t('storybook.mantine.badge_info')}</Badge>\r
              <Badge variant="filled" color="purple">{t('storybook.mantine.badge_purple')}</Badge>\r
              <Badge variant="filled" color="sale">{t('storybook.mantine.badge_sale')}</Badge>\r
            </Group>\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(m=s.parameters)===null||m===void 0||(g=m.docs)===null||g===void 0?void 0:g.source}}};const S=["Default"];export{s as Default,S as __namedExportsOrder,w as default};
