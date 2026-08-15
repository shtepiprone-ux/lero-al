import{j as e}from"./iframe-BWqC60Cj.js";import{s as h}from"./_storyI18n-DUPbxmag.js";import{U as u}from"./UserMenu-ntXl61Ut.js";import{M as _}from"./_MantineStoryShell-v1yXHo2n.js";import{S as a}from"./Stack-DqzY2ynC.js";import{T as d}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./RangeDatePicker-Dt_rNT9t.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import"./user-a-99c5gD.js";import"./layout-dashboard-S9G1ehrF.js";import"./log-out-B4dZezxG.js";import"./chevron-down-B9O36-Ph.js";var s,l,m;const{within:f,userEvent:v}=__STORYBOOK_MODULE_TEST__,fe={title:"Mantine/Primitives/UserMenu",parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Title under `Mantine/Primitives/` (Task 578, canonical Mantine story location gate —\r\nsame rationale as `HeaderActions`/`LocaleSwitcher`/`FiltersPanelShell`): the rendered-assert\r\nharness only gives PERMANENT, standing enforcement under `--mantine-only` to stories whose\r\ntitle matches this exact prefix.\r\n\n`UserMenu` is NOT in the harness's `MANTINE_OVERLAY_PRIMITIVES` open-trigger set (that set\r\nmatches on `DropdownMenu`, not `UserMenu`, as the title's last segment), so the harness will\r\nNOT auto-click it open — the `play` function below opens both fixtures itself (Storybook runs\r\n`play` automatically as part of the normal render lifecycle, before the harness's screenshot),\r\nmirroring the `AdminLocaleSwitcher.stories.tsx` `MobileBottomSheet` precedent (Task 576)."}}}},o={render:(p,t)=>{var r,n;const i=(n=t==null||(r=t.globals)===null||r===void 0?void 0:r.locale)!==null&&n!==void 0?n:"en",c=g=>h(i,`storybook.mantine.${g}`);return e.jsx(_,{children:e.jsxs(a,{gap:"xl",children:[e.jsxs(a,{gap:"xs",children:[e.jsx(d,{size:"xs",c:"gray.5",fw:500,children:c("user_menu_regular_caption")}),e.jsx(u,{user:{name:"Alba Krasniqi",avatar_url:null,role:"user"},locale:i,onNavigate:()=>{},onOpenAdmin:()=>{},onLogout:()=>{}})]}),e.jsxs(a,{gap:"xs",children:[e.jsx(d,{size:"xs",c:"gray.5",fw:500,children:c("user_menu_admin_caption")}),e.jsx(u,{user:{name:"Driton Berisha",avatar_url:null,role:"admin"},locale:i,onNavigate:()=>{},onOpenAdmin:()=>{},onLogout:()=>{}})]})]})})},play:async({canvasElement:p})=>{if(window.innerWidth<640)return;const r=await f(p).findByRole("button",{name:/Driton Berisha/});await v.click(r)}};o.parameters={...o.parameters,docs:{...(s=o.parameters)===null||s===void 0?void 0:s.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              {t('user_menu_regular_caption')}\r
            </Text>\r
            <UserMenu user={{
            name: 'Alba Krasniqi',
            avatar_url: null,
            role: 'user'
          }} locale={locale} onNavigate={() => {}} onOpenAdmin={() => {}} onLogout={() => {}} />\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              {t('user_menu_admin_caption')}\r
            </Text>\r
            <UserMenu user={{
            name: 'Driton Berisha',
            avatar_url: null,
            role: 'admin'
          }} locale={locale} onNavigate={() => {}} onOpenAdmin={() => {}} onLogout={() => {}} />\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  },
  play: async ({
    canvasElement
  }) => {
    if (window.innerWidth < 640) return;
    const canvas = within(canvasElement);
    // Open ONLY the admin fixture — two independent uncontrolled MantineDropdownMenus both left
    // open overlap on desktop (Task 585). The admin menu is the differentiating proof (Dashboard
    // item); the regular fixture's trigger stays closed and fully visible. The regular menu's
    // no-Admin-item role gate is a plain \`role === 'admin'|'moderator'\` conditional in
    // UserMenu.tsx, verified by code inspection (not by a second open dropdown).
    const adminTrigger = await canvas.findByRole('button', {
      name: /Driton Berisha/
    });
    await userEvent.click(adminTrigger);
  }
}`,...(m=o.parameters)===null||m===void 0||(l=m.docs)===null||l===void 0?void 0:l.source}}};const ve=["Default"];export{o as Default,ve as __namedExportsOrder,fe as default};
