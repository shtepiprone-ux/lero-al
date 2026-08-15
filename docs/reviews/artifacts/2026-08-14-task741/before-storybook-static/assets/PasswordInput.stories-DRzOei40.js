import{j as e,G as x}from"./iframe-BWqC60Cj.js";import{c as k}from"./passwordRules-CYUcrpGI.js";import{s as _}from"./_storyI18n-DUPbxmag.js";import{M as f}from"./_MantineStoryShell-v1yXHo2n.js";import{S as l}from"./Stack-DqzY2ynC.js";import{T as o}from"./Text-ZiglToyN.js";import{P as t}from"./PasswordInput-C-zO3SDg.js";import{C as v}from"./check-BHCgvXo2.js";import{X as T}from"./x-oNeZx8ai.js";import"./preload-helper-Dp1pzeXC.js";import"./Input-ChQbmR0L.js";import"./ActionIcon-BlvdNdEl.js";import"./InputBase-DV75-CNg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./createLucideIcon-DZTr3VOw.js";var d,g,u;const O={title:"Mantine/Primitives/PasswordInput",parameters:{skipCanvas:!0,layout:"fullscreen"}},h="Secret1",i={render:(j,n)=>{var p,c;const w=(c=n==null||(p=n.globals)===null||p===void 0?void 0:p.locale)!==null&&c!==void 0?c:"en",r=a=>_(w,`storybook.mantine.${a}`),s=a=>_(w,`auth.${a}`),m=k(h),y=[{key:"length",label:s("password_rule_length")},{key:"uppercase",label:s("password_rule_uppercase")},{key:"lowercase",label:s("password_rule_lowercase")},{key:"digit",label:s("password_rule_digit")},{key:"special",label:s("password_rule_special")}];return e.jsx(f,{children:e.jsxs(l,{gap:"xl",children:[e.jsxs(l,{gap:"xs",children:[e.jsx(o,{size:"xs",c:"gray.5",fw:500,children:"basic — gray-2 border / shadow-xs / brand focus-within / 44px outer box / reveal toggle (icon-only → ≥44px exempt per CLAUDE.md)"}),e.jsx(t,{label:r("pw_label"),placeholder:r("pw_placeholder"),description:r("ta_hint"),visibilityToggleButtonProps:{"aria-label":r("pw_toggle_show")}})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(o,{size:"xs",c:"gray.5",fw:500,children:"requirements-hint — 4 met / 1 unmet (special); rule strings reuse auth.password_rule_*; uk wraps at 320"}),e.jsx(t,{label:r("pw_label"),defaultValue:h,visibilityToggleButtonProps:{"aria-label":r("pw_toggle_show")}}),e.jsx(l,{gap:4,pl:"xs",children:y.map(({key:a,label:b})=>m[a]?e.jsxs(x,{gap:"xs",children:[e.jsx(v,{size:14,"aria-hidden":!0,color:"var(--mantine-color-green-6)"}),e.jsx(o,{size:"sm",c:"green.6",children:b})]},a):e.jsxs(x,{gap:"xs",children:[e.jsx(T,{size:14,"aria-hidden":!0,color:"var(--mantine-color-gray-5)"}),e.jsx(o,{size:"sm",c:"gray.5",children:b})]},a))})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(o,{size:"xs",c:"gray.5",fw:500,children:"error — data-error on outer .mantine-PasswordInput-input → red-6 border / no shadow; toggle still operable; label unchanged"}),e.jsx(t,{label:r("pw_label"),placeholder:r("pw_placeholder"),error:r("pw_error"),visibilityToggleButtonProps:{"aria-label":r("pw_toggle_show")}})]}),e.jsxs(l,{gap:"xs",children:[e.jsx(o,{size:"xs",c:"gray.5",fw:500,children:"disabled — whole control faded (label + outer box + reveal toggle → opacity 0.5); transparent bg; not-allowed; no red"}),e.jsx(t,{label:r("pw_label"),placeholder:r("pw_placeholder"),disabled:!0,visibilityToggleButtonProps:{"aria-label":r("pw_toggle_show")}})]})]})})}};i.parameters={...i.parameters,docs:{...(d=i.parameters)===null||d===void 0?void 0:d.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    const ta = (key: string) => storyT(locale, \`auth.\${key}\`);
    const rules = checkPasswordRules(DEMO_VALUE);
    const ruleRows: Array<{
      key: keyof typeof rules;
      label: string;
    }> = [{
      key: 'length',
      label: ta('password_rule_length')
    }, {
      key: 'uppercase',
      label: ta('password_rule_uppercase')
    }, {
      key: 'lowercase',
      label: ta('password_rule_lowercase')
    }, {
      key: 'digit',
      label: ta('password_rule_digit')
    }, {
      key: 'special',
      label: ta('password_rule_special')
    }];
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          {/* 1 — basic: gray-2 border / shadow-xs / brand :focus-within / reveal toggle */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              basic — gray-2 border / shadow-xs / brand focus-within / 44px outer box / reveal toggle (icon-only → ≥44px exempt per CLAUDE.md)\r
            </Text>\r
            <PasswordInput label={t('pw_label')} placeholder={t('pw_placeholder')} description={t('ta_hint')} visibilityToggleButtonProps={{
            'aria-label': t('pw_toggle_show')
          }} />\r
          </Stack>\r
\r
          {/* 2 — requirements hint: checkPasswordRules drives met/unmet rows; rule strings from auth.* */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              requirements-hint — 4 met / 1 unmet (special); rule strings reuse auth.password_rule_*; uk wraps at 320\r
            </Text>\r
            <PasswordInput label={t('pw_label')} defaultValue={DEMO_VALUE} visibilityToggleButtonProps={{
            'aria-label': t('pw_toggle_show')
          }} />\r
            <Stack gap={4} pl="xs">\r
              {ruleRows.map(({
              key,
              label
            }) => rules[key] ? <Group key={key} gap="xs">\r
                    <Check size={14} aria-hidden color="var(--mantine-color-green-6)" />\r
                    <Text size="sm" c="green.6">{label}</Text>\r
                  </Group> : <Group key={key} gap="xs">\r
                    <X size={14} aria-hidden color="var(--mantine-color-gray-5)" />\r
                    <Text size="sm" c="gray.5">{label}</Text>\r
                  </Group>)}\r
            </Stack>\r
          </Stack>\r
\r
          {/* 3 — error: data-error on .mantine-PasswordInput-input → red-6 border / no shadow */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              error — data-error on outer .mantine-PasswordInput-input → red-6 border / no shadow; toggle still operable; label unchanged\r
            </Text>\r
            <PasswordInput label={t('pw_label')} placeholder={t('pw_placeholder')} error={t('pw_error')} visibilityToggleButtonProps={{
            'aria-label': t('pw_toggle_show')
          }} />\r
          </Stack>\r
\r
          {/* 4 — disabled: whole control faded — label + outer box + reveal toggle all at opacity 0.5 (§6e) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disabled — whole control faded (label + outer box + reveal toggle → opacity 0.5); transparent bg; not-allowed; no red\r
            </Text>\r
            <PasswordInput label={t('pw_label')} placeholder={t('pw_placeholder')} disabled visibilityToggleButtonProps={{
            'aria-label': t('pw_toggle_show')
          }} />\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(u=i.parameters)===null||u===void 0||(g=u.docs)===null||g===void 0?void 0:g.source}}};const $=["Default"];export{i as Default,$ as __namedExportsOrder,O as default};
