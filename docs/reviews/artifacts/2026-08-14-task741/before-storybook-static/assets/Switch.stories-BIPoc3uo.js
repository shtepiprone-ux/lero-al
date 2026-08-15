import{r as A,k as W,l as $,j as e,A as oe,T as ce,O as ie,h as q,C as ne,D as de,K as g,M as he}from"./iframe-BWqC60Cj.js";import{s as ue}from"./_storyI18n-DUPbxmag.js";import{M as be}from"./_MantineStoryShell-v1yXHo2n.js";import{S as n}from"./Stack-DqzY2ynC.js";import{T as u}from"./Text-ZiglToyN.js";import{I as pe,a as we,b as ge}from"./InputsGroupFieldset-BRoqHMGd.js";import{I as B}from"./Input-ChQbmR0L.js";import{u as F}from"./use-uncontrolled-CxrsbXe8.js";import"./preload-helper-Dp1pzeXC.js";var K={root:"m_5f93f3bb",input:"m_926b4011",track:"m_9307d992",thumb:"m_93039a1d",trackLabel:"m_8277e082"};const U=A.createContext(null),xe=U.Provider,ke=()=>A.useContext(U),G=W((d,o)=>{const{value:t,defaultValue:a,onChange:b,size:r,wrapperProps:h,children:x,readOnly:S,disabled:E,...y}=$("SwitchGroup",null,d),[i,k]=F({value:t,defaultValue:a,finalValue:[],onChange:b}),v=j=>{const m=j.currentTarget.value;!S&&k(i.includes(m)?i.filter(C=>C!==m):[...i,m])};return e.jsx(xe,{value:{value:i,onChange:v,size:r,disabled:E},children:e.jsx(B.Wrapper,{size:r,ref:o,...h,...y,labelElement:"div",__staticSelector:"SwitchGroup",children:e.jsx(pe,{role:"group",children:x})})})});G.classes=B.Wrapper.classes;G.displayName="@mantine/core/SwitchGroup";const me={labelPosition:"right",withThumbIndicator:!0},fe=ne((d,{radius:o,color:t,size:a})=>({root:{"--switch-radius":o===void 0?void 0:he(o),"--switch-height":g(a,"switch-height"),"--switch-width":g(a,"switch-width"),"--switch-thumb-size":g(a,"switch-thumb-size"),"--switch-label-font-size":g(a,"switch-label-font-size"),"--switch-track-label-padding":g(a,"switch-track-label-padding"),"--switch-color":t?de(t,d):void 0}})),s=W((d,o)=>{const t=$("Switch",me,d),{classNames:a,className:b,style:r,styles:h,unstyled:x,vars:S,color:E,label:y,offLabel:i,onLabel:k,id:v,size:j,radius:m,wrapperProps:C,thumbIcon:V,checked:D,defaultChecked:H,onChange:T,labelPosition:M,description:J,error:R,disabled:Q,variant:X,rootRef:Y,mod:Z,withThumbIndicator:ee,attributes:re,...ae}=t,l=ke(),te=j||(l==null?void 0:l.size),p=oe({name:"Switch",props:t,classes:K,className:b,style:r,classNames:a,styles:h,unstyled:x,attributes:re,vars:S,varsResolver:fe}),{styleProps:le,rest:f}=ce(ae),L=ie(v),c={checked:(l==null?void 0:l.value.includes(f.value))??D,onChange:w=>{l==null||l.onChange(w),T==null||T(w)},disabled:(l==null?void 0:l.disabled)??Q},[N,se]=F({value:c.checked??D,defaultValue:H,finalValue:!1});return e.jsxs(we,{...p("root"),__staticSelector:"Switch",__stylesApiProps:t,id:L,size:te,labelPosition:M,label:y,description:J,error:R,disabled:c.disabled,bodyElement:"label",labelElement:"span",classNames:a,styles:h,unstyled:x,"data-checked":c.checked,variant:X,ref:Y,mod:Z,inert:f.inert,...le,...C,children:[e.jsx("input",{...f,...c,checked:N,"data-checked":c.checked,onChange:w=>{var O;(O=c.onChange)==null||O.call(c,w),se(w.currentTarget.checked)},id:L,ref:o,type:"checkbox",role:"switch",inert:f.inert,...p("input")}),e.jsxs(q,{"aria-hidden":"true",component:"span",mod:{error:R,"label-position":M,"without-labels":!k&&!i},...p("track"),children:[e.jsx(q,{component:"span",mod:{"reduce-motion":!0,"with-thumb-indicator":ee&&!V},...p("thumb"),children:V}),e.jsx("span",{...p("trackLabel"),children:N?k:i})]})]})});s.classes={...K,...ge};s.displayName="@mantine/core/Switch";s.Group=G;var z,I,P;const Pe={title:"Mantine/Primitives/Switch",parameters:{skipCanvas:!0,layout:"fullscreen"}},_={render:(d,o)=>{var t,a;const b=(a=o==null||(t=o.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en",r=h=>ue(b,`storybook.mantine.${h}`);return e.jsx(be,{children:e.jsxs(n,{gap:"xl",children:[e.jsxs(n,{gap:"xs",children:[e.jsx(u,{size:"xs",c:"gray.5",fw:500,children:"unchecked — neutral-300 track / white thumb at rest-left / label gray-7 / ≥44px tap row"}),e.jsx(s,{label:r("sw_label")})]}),e.jsxs(n,{gap:"xs",children:[e.jsx(u,{size:"xs",c:"gray.5",fw:500,children:"checked — brand-7 (#EC5447) track fill + white thumb slid right; label unchanged"}),e.jsx(s,{label:r("sw_label"),defaultChecked:!0})]}),e.jsxs(n,{gap:"xs",children:[e.jsx(u,{size:"xs",c:"gray.5",fw:500,children:"focus — keyboard focus ring (brand, :focus-visible); no ring on mouse click"}),e.jsx(s,{label:r("sw_label")})]}),e.jsxs(n,{gap:"xs",children:[e.jsx(u,{size:"xs",c:"gray.5",fw:500,children:"error — red-6 inset border + ring (unchecked); checked+error → brand fill retained (no red ring)"}),e.jsx(s,{label:r("sw_label"),error:r("sw_error")}),e.jsx(s,{label:r("sw_label"),defaultChecked:!0,error:r("sw_error")})]}),e.jsxs(n,{gap:"xs",children:[e.jsx(u,{size:"xs",c:"gray.5",fw:500,children:"disabled — whole control faded (track + thumb + label → opacity 0.5); not-allowed; no focus ring"}),e.jsx(s,{label:r("sw_label"),disabled:!0}),e.jsx(s,{label:r("sw_label"),defaultChecked:!0,disabled:!0})]}),e.jsxs(n,{gap:"xs",children:[e.jsx(u,{size:"xs",c:"gray.5",fw:500,children:"long label — wraps to ≥2 lines at 320; no clip / no h-scroll at any locale (sq/en/uk/it)"}),e.jsx(s,{label:r("sw_long_label")})]})]})})}};_.parameters={..._.parameters,docs:{...(z=_.parameters)===null||z===void 0?void 0:z.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* 1 — unchecked: neutral-300 track / white thumb left / label gray-7 / ≥44px row */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              unchecked — neutral-300 track / white thumb at rest-left / label gray-7 / ≥44px tap row\r
            </Text>\r
            <Switch label={t('sw_label')} />\r
          </Stack>\r
\r
          {/* 2 — checked: brand-7 track fill + white thumb slid right */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              checked — brand-7 (#EC5447) track fill + white thumb slid right; label unchanged\r
            </Text>\r
            <Switch label={t('sw_label')} defaultChecked />\r
          </Stack>\r
\r
          {/* 3 — focus: keyboard focus ring (brand, :focus-visible) — Tab to the switch to see */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              focus — keyboard focus ring (brand, :focus-visible); no ring on mouse click\r
            </Text>\r
            <Switch label={t('sw_label')} />\r
          </Stack>\r
\r
          {/* 4 — error: red-6 border-sim + ring (unchecked); checked+error → brand fill keeps */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              error — red-6 inset border + ring (unchecked); checked+error → brand fill retained (no red ring)\r
            </Text>\r
            <Switch label={t('sw_label')} error={t('sw_error')} />\r
            <Switch label={t('sw_label')} defaultChecked error={t('sw_error')} />\r
          </Stack>\r
\r
          {/* 5 — disabled: whole control faded — track + thumb + label → opacity 0.5 (§6h) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disabled — whole control faded (track + thumb + label → opacity 0.5); not-allowed; no focus ring\r
            </Text>\r
            <Switch label={t('sw_label')} disabled />\r
            <Switch label={t('sw_label')} defaultChecked disabled />\r
          </Stack>\r
\r
          {/* 6 — long label: wraps ≥2 lines at 320; no clip / no h-scroll */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              long label — wraps to ≥2 lines at 320; no clip / no h-scroll at any locale (sq/en/uk/it)\r
            </Text>\r
            <Switch label={t('sw_long_label')} />\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(P=_.parameters)===null||P===void 0||(I=P.docs)===null||I===void 0?void 0:I.source}}};const Ge=["Default"];export{_ as Default,Ge as __namedExportsOrder,Pe as default};
