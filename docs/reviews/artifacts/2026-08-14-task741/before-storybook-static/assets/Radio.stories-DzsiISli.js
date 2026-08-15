import{aE as re,k as N,l as E,A as F,ae as xe,j as e,Y as ge,C as K,M as L,O as oe,m as ee,h as q,aF as ae,D as V,af as le,K as $,T as he}from"./iframe-BWqC60Cj.js";import{s as me}from"./_storyI18n-DUPbxmag.js";import{M as ve}from"./_MantineStoryShell-v1yXHo2n.js";import{S as C}from"./Stack-DqzY2ynC.js";import{T as I}from"./Text-ZiglToyN.js";import{g as se}from"./get-auto-contrast-value-Da6zqqWm.js";import{I as ye,a as _e}from"./InputsGroupFieldset-BRoqHMGd.js";import{I as ie}from"./Input-ChQbmR0L.js";import{u as ke}from"./use-uncontrolled-CxrsbXe8.js";import"./preload-helper-Dp1pzeXC.js";var te={root:"m_f3f1af94",inner:"m_89c4f5e4",icon:"m_f3ed6b2b",radio:"m_8a3dbb89","radio--outline":"m_1bfe9d39"};const[we,ne]=re(),[Re,je]=re();var ce={card:"m_9dc8ae12"};const Se={withBorder:!0},Ce=K((r,{radius:l})=>({card:{"--card-radius":L(l)}})),W=N((r,l)=>{const o=E("RadioCard",Se,r),{classNames:s,className:d,style:a,styles:t,unstyled:i,vars:f,checked:v,mod:j,withBorder:z,value:y,onClick:_,name:g,onKeyDown:k,attributes:h,...T}=o,G=F({name:"RadioCard",classes:ce,props:o,className:d,style:a,classNames:s,styles:t,unstyled:i,attributes:h,vars:f,varsResolver:Ce,rootSelector:"card"}),{dir:w}=xe(),u=ne(),m=typeof v=="boolean"?v:(u==null?void 0:u.value)===y||!1,P=g||(u==null?void 0:u.name),A=p=>{if(k==null||k(p),["ArrowDown","ArrowUp","ArrowLeft","ArrowRight"].includes(p.nativeEvent.code)){p.preventDefault();const b=Array.from(document.querySelectorAll(`[role="radio"][name="${P||"__mantine"}"]`)),S=b.findIndex(n=>n===p.target),R=S+1>=b.length?0:S+1,x=S-1<0?b.length-1:S-1;p.nativeEvent.code==="ArrowDown"&&(b[R].focus(),b[R].click()),p.nativeEvent.code==="ArrowUp"&&(b[x].focus(),b[x].click()),p.nativeEvent.code==="ArrowLeft"&&(b[w==="ltr"?x:R].focus(),b[w==="ltr"?x:R].click()),p.nativeEvent.code==="ArrowRight"&&(b[w==="ltr"?R:x].focus(),b[w==="ltr"?R:x].click())}};return e.jsx(Re,{value:{checked:m},children:e.jsx(ge,{ref:l,mod:[{"with-border":z,checked:m},j],...G("card"),...T,role:"radio","aria-checked":m,name:P,onClick:p=>{_==null||_(p),u==null||u.onChange(y||"")},onKeyDown:A})})});W.displayName="@mantine/core/RadioCard";W.classes=ce;const Y=N((r,l)=>{const{value:o,defaultValue:s,onChange:d,size:a,wrapperProps:t,children:i,name:f,readOnly:v,disabled:j,...z}=E("RadioGroup",null,r),y=oe(f),[_,g]=ke({value:o,defaultValue:s,finalValue:"",onChange:d}),k=h=>!v&&g(typeof h=="string"?h:h.currentTarget.value);return e.jsx(we,{value:{value:_,onChange:k,size:a,name:y,disabled:j},children:e.jsx(ie.Wrapper,{size:a,ref:l,...t,...z,labelElement:"div",__staticSelector:"RadioGroup",children:e.jsx(ye,{role:"radiogroup",children:i})})})});Y.classes=ie.Wrapper.classes;Y.displayName="@mantine/core/RadioGroup";function de({size:r,style:l,...o}){return e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 5 5",style:{width:ee(r),height:ee(r),...l},"aria-hidden":!0,...o,children:e.jsx("circle",{cx:"2.5",cy:"2.5",r:"2.5",fill:"currentColor"})})}var ue={indicator:"m_717d7ff6",icon:"m_3e4da632","indicator--outline":"m_2980836c"};const ze={icon:de},Te=K((r,{radius:l,color:o,size:s,iconColor:d,variant:a,autoContrast:t})=>{const i=ae({color:o||r.primaryColor,theme:r}),f=i.isThemeColor&&i.shade===void 0?`var(--mantine-color-${i.color}-outline)`:i.color;return{indicator:{"--radio-size":$(s,"radio-size"),"--radio-radius":l===void 0?void 0:L(l),"--radio-color":a==="outline"?f:V(o,r),"--radio-icon-size":$(s,"radio-icon-size"),"--radio-icon-color":d?V(d,r):se(t,r)?le({color:o,theme:r,autoContrast:t}):void 0}}}),H=N((r,l)=>{const o=E("RadioIndicator",ze,r),{classNames:s,className:d,style:a,styles:t,unstyled:i,vars:f,icon:v,radius:j,color:z,iconColor:y,autoContrast:_,checked:g,mod:k,variant:h,disabled:T,attributes:G,...w}=o,u=F({name:"RadioIndicator",classes:ue,props:o,className:d,style:a,classNames:s,styles:t,unstyled:i,attributes:G,vars:f,varsResolver:Te,rootSelector:"indicator"}),m=je(),P=typeof g=="boolean"?g:(m==null?void 0:m.checked)||!1;return e.jsx(q,{ref:l,...u("indicator",{variant:h}),variant:h,mod:[{checked:P,disabled:T},k],...w,children:e.jsx(v,{...u("icon")})})});H.displayName="@mantine/core/RadioIndicator";H.classes=ue;const Ie={labelPosition:"right"},Ge=K((r,{size:l,radius:o,color:s,iconColor:d,variant:a,autoContrast:t})=>{const i=ae({color:s||r.primaryColor,theme:r}),f=i.isThemeColor&&i.shade===void 0?`var(--mantine-color-${i.color}-outline)`:i.color;return{root:{"--radio-size":$(l,"radio-size"),"--radio-radius":o===void 0?void 0:L(o),"--radio-color":a==="outline"?f:V(s,r),"--radio-icon-color":d?V(d,r):se(t,r)?le({color:s,theme:r,autoContrast:t}):void 0,"--radio-icon-size":$(l,"radio-icon-size")}}}),c=N((r,l)=>{const o=E("Radio",Ie,r),{classNames:s,className:d,style:a,styles:t,unstyled:i,vars:f,id:v,size:j,label:z,labelPosition:y,description:_,error:g,radius:k,color:h,variant:T,disabled:G,wrapperProps:w,icon:u=de,rootRef:m,iconColor:P,onChange:A,mod:p,attributes:b,checked:S,...R}=o,x=F({name:"Radio",classes:te,props:o,className:d,style:a,classNames:s,styles:t,unstyled:i,attributes:b,vars:f,varsResolver:Ge}),n=ne(),be=(n==null?void 0:n.size)??j,pe=o.size?j:be,{styleProps:fe,rest:M}=he(R),J=oe(v),Q=n?n.value===M.value:void 0,X={checked:Q??S,name:(n==null?void 0:n.name)??M.name,onChange:Z=>{n==null||n.onChange(Z),A==null||A(Z)},disabled:(n==null?void 0:n.disabled)??G};return e.jsx(_e,{...x("root"),__staticSelector:"Radio",__stylesApiProps:o,id:J,size:pe,labelPosition:y,label:z,description:_,error:g,disabled:X.disabled,classNames:s,styles:t,unstyled:i,"data-checked":(Q??S)||void 0,variant:T,ref:m,mod:p,...fe,...w,children:e.jsxs(q,{...x("inner"),mod:{"label-position":y},children:[e.jsx(q,{...x("radio",{focusable:!0,variant:T}),...M,...X,component:"input",mod:{error:!!g},ref:l,id:J,type:"radio"}),e.jsx(u,{...x("icon"),"aria-hidden":!0})]})})});c.classes=te;c.displayName="@mantine/core/Radio";c.Group=Y;c.Card=W;c.Indicator=H;var B,O,U;const Ue={title:"Mantine/Primitives/Radio",parameters:{skipCanvas:!0,layout:"fullscreen"}},D={render:(r,l)=>{var o,s;const d=(s=l==null||(o=l.globals)===null||o===void 0?void 0:o.locale)!==null&&s!==void 0?s:"en",a=t=>me(d,`storybook.mantine.${t}`);return e.jsx(ve,{children:e.jsxs(C,{gap:"xl",children:[e.jsxs(C,{gap:"xs",children:[e.jsx(I,{size:"xs",c:"gray.5",fw:500,children:"unchecked — gray-3 border / 16px circle / rounded-full / label gray-7 / ≥44px tap row"}),e.jsx(c,{value:"a",label:a("rb_label")})]}),e.jsxs(C,{gap:"xs",children:[e.jsx(I,{size:"xs",c:"gray.5",fw:500,children:"checked — brand-7 fill + white 8px center dot; label unchanged"}),e.jsx(c.Group,{defaultValue:"b",children:e.jsx(c,{value:"b",label:a("rb_label")})})]}),e.jsxs(C,{gap:"xs",children:[e.jsx(I,{size:"xs",c:"gray.5",fw:500,children:"focus — keyboard focus ring (brand, :focus-visible); no ring on mouse click"}),e.jsx(c,{value:"c",label:a("rb_label")})]}),e.jsxs(C,{gap:"xs",children:[e.jsx(I,{size:"xs",c:"gray.5",fw:500,children:"error — red-6 border + ring (unchecked); checked+error → brand border wins (no red on filled circle)"}),e.jsx(c,{value:"d1",label:a("rb_label"),error:a("rb_error")}),e.jsx(c.Group,{defaultValue:"d2",children:e.jsx(c,{value:"d2",label:a("rb_label"),error:a("rb_error")})})]}),e.jsxs(C,{gap:"xs",children:[e.jsx(I,{size:"xs",c:"gray.5",fw:500,children:"disabled — whole control faded (circle + label → opacity 0.5); not-allowed; no focus ring"}),e.jsx(c,{value:"e1",label:a("rb_label"),disabled:!0}),e.jsx(c.Group,{defaultValue:"e2",children:e.jsx(c,{value:"e2",label:a("rb_label"),disabled:!0})})]}),e.jsxs(C,{gap:"xs",children:[e.jsx(I,{size:"xs",c:"gray.5",fw:500,children:"long label — wraps to ≥2 lines at 320; no clip / no h-scroll at any locale (sq/en/uk/it)"}),e.jsx(c,{value:"f",label:a("rb_long_label")})]})]})})}};D.parameters={...D.parameters,docs:{...(B=D.parameters)===null||B===void 0?void 0:B.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* 1 — unchecked: gray-3 border / 16px circle / label gray-7 / ≥44px tap row */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              unchecked — gray-3 border / 16px circle / rounded-full / label gray-7 / ≥44px tap row\r
            </Text>\r
            <Radio value="a" label={t('rb_label')} />\r
          </Stack>\r
\r
          {/* 2 — checked: brand-7 fill + white 8px center dot */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              checked — brand-7 fill + white 8px center dot; label unchanged\r
            </Text>\r
            <Radio.Group defaultValue="b">\r
              <Radio value="b" label={t('rb_label')} />\r
            </Radio.Group>\r
          </Stack>\r
\r
          {/* 3 — focus: keyboard focus ring (brand) — Tab to the radio to see */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              focus — keyboard focus ring (brand, :focus-visible); no ring on mouse click\r
            </Text>\r
            <Radio value="c" label={t('rb_label')} />\r
          </Stack>\r
\r
          {/* 4 — error: red-6 border + ring; checked+error → brand border wins */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              error — red-6 border + ring (unchecked); checked+error → brand border wins (no red on filled circle)\r
            </Text>\r
            <Radio value="d1" label={t('rb_label')} error={t('rb_error')} />\r
            <Radio.Group defaultValue="d2">\r
              <Radio value="d2" label={t('rb_label')} error={t('rb_error')} />\r
            </Radio.Group>\r
          </Stack>\r
\r
          {/* 5 — disabled: whole control faded — circle + label → opacity 0.5 (§6g) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disabled — whole control faded (circle + label → opacity 0.5); not-allowed; no focus ring\r
            </Text>\r
            <Radio value="e1" label={t('rb_label')} disabled />\r
            <Radio.Group defaultValue="e2">\r
              <Radio value="e2" label={t('rb_label')} disabled />\r
            </Radio.Group>\r
          </Stack>\r
\r
          {/* 6 — long label: wraps ≥2 lines at 320; no clip / no h-scroll */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              long label — wraps to ≥2 lines at 320; no clip / no h-scroll at any locale (sq/en/uk/it)\r
            </Text>\r
            <Radio value="f" label={t('rb_long_label')} />\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(U=D.parameters)===null||U===void 0||(O=U.docs)===null||O===void 0?void 0:O.source}}};const qe=["Default"];export{D as Default,qe as __namedExportsOrder,Ue as default};
