import{r as $,aE as pe,k as V,l as D,A as F,j as e,Y as ke,C as U,M as W,h as q,aF as Q,D as G,af as X,K as Z,T as fe,O as me}from"./iframe-BWqC60Cj.js";import{s as ge}from"./_storyI18n-DUPbxmag.js";import{M as Ce}from"./_MantineStoryShell-v1yXHo2n.js";import{S as j}from"./Stack-DqzY2ynC.js";import{T as z}from"./Text-ZiglToyN.js";import{g as ee}from"./get-auto-contrast-value-Da6zqqWm.js";import{I as ye,a as ve,b as _e}from"./InputsGroupFieldset-BRoqHMGd.js";import{u as re}from"./use-uncontrolled-CxrsbXe8.js";import{I as oe}from"./Input-ChQbmR0L.js";import{C as ae}from"./CheckIcon-31AzgUPg.js";import"./preload-helper-Dp1pzeXC.js";var se={root:"m_bf2d988c",inner:"m_26062bec",input:"m_26063560",icon:"m_bf295423","input--outline":"m_215c4542"};const le=$.createContext(null),je=le.Provider,ce=()=>$.useContext(le),[Se,we]=pe();var te={card:"m_26775b0a"};const Te={withBorder:!0},ze=U((r,{radius:s})=>({card:{"--card-radius":W(s)}})),K=V((r,s)=>{const o=D("CheckboxCard",Te,r),{classNames:c,className:n,style:a,styles:t,unstyled:l,vars:u,checked:C,mod:h,withBorder:p,value:y,onClick:v,defaultChecked:f,onChange:x,attributes:m,...S}=o,w=F({name:"CheckboxCard",classes:te,props:o,className:n,style:a,classNames:c,styles:t,unstyled:l,attributes:m,vars:u,varsResolver:ze,rootSelector:"card"}),k=ce(),T=typeof C=="boolean"?C:k?k.value.includes(y||""):void 0,[d,_]=re({value:T,defaultValue:f,finalValue:!1,onChange:x});return e.jsx(Se,{value:{checked:d},children:e.jsx(ke,{ref:s,mod:[{"with-border":p,checked:d},h],...w("card"),...S,role:"checkbox","aria-checked":d,onClick:I=>{v==null||v(I),k==null||k.onChange(y||""),_(!d)}})})});K.displayName="@mantine/core/CheckboxCard";K.classes=te;const Y=V((r,s)=>{const{value:o,defaultValue:c,onChange:n,size:a,wrapperProps:t,children:l,readOnly:u,disabled:C,...h}=D("CheckboxGroup",null,r),[p,y]=re({value:o,defaultValue:c,finalValue:[],onChange:n}),v=f=>{const x=typeof f=="string"?f:f.currentTarget.value;!u&&y(p.includes(x)?p.filter(m=>m!==x):[...p,x])};return e.jsx(je,{value:{value:p,onChange:v,size:a,disabled:C},children:e.jsx(oe.Wrapper,{size:a,ref:s,...t,...h,labelElement:"div",__staticSelector:"CheckboxGroup",children:e.jsx(ye,{role:"group",children:l})})})});Y.classes=oe.Wrapper.classes;Y.displayName="@mantine/core/CheckboxGroup";var ne={indicator:"m_5e5256ee",icon:"m_1b1c543a","indicator--outline":"m_76e20374"};const Ie={icon:ae,variant:"filled"},Pe=U((r,{radius:s,color:o,size:c,iconColor:n,variant:a,autoContrast:t})=>{const l=Q({color:o||r.primaryColor,theme:r}),u=l.isThemeColor&&l.shade===void 0?`var(--mantine-color-${l.color}-outline)`:l.color;return{indicator:{"--checkbox-size":Z(c,"checkbox-size"),"--checkbox-radius":s===void 0?void 0:W(s),"--checkbox-color":a==="outline"?u:G(o,r),"--checkbox-icon-color":n?G(n,r):ee(t,r)?X({color:o,theme:r,autoContrast:t}):void 0}}}),H=V((r,s)=>{const o=D("CheckboxIndicator",Ie,r),{classNames:c,className:n,style:a,styles:t,unstyled:l,vars:u,icon:C,indeterminate:h,radius:p,color:y,iconColor:v,autoContrast:f,checked:x,mod:m,variant:S,disabled:w,attributes:k,...T}=o,d=F({name:"CheckboxIndicator",classes:ne,props:o,className:n,style:a,classNames:c,styles:t,unstyled:l,attributes:k,vars:u,varsResolver:Pe,rootSelector:"indicator"}),_=we(),I=typeof x=="boolean"||typeof h=="boolean"?x||h:(_==null?void 0:_.checked)||!1;return e.jsx(q,{ref:s,...d("indicator",{variant:S}),variant:S,mod:[{checked:I,disabled:w},m],...T,children:e.jsx(C,{indeterminate:h,...d("icon")})})});H.displayName="@mantine/core/CheckboxIndicator";H.classes=ne;const Re={labelPosition:"right",icon:ae,variant:"filled"},Ne=U((r,{radius:s,color:o,size:c,iconColor:n,variant:a,autoContrast:t})=>{const l=Q({color:o||r.primaryColor,theme:r}),u=l.isThemeColor&&l.shade===void 0?`var(--mantine-color-${l.color}-outline)`:l.color;return{root:{"--checkbox-size":Z(c,"checkbox-size"),"--checkbox-radius":s===void 0?void 0:W(s),"--checkbox-color":a==="outline"?u:G(o,r),"--checkbox-icon-color":n?G(n,r):ee(t,r)?X({color:o,theme:r,autoContrast:t}):void 0}}}),i=V((r,s)=>{const o=D("Checkbox",Re,r),{classNames:c,className:n,style:a,styles:t,unstyled:l,vars:u,color:C,label:h,id:p,size:y,radius:v,wrapperProps:f,checked:x,labelPosition:m,description:S,error:w,disabled:k,variant:T,indeterminate:d,icon:_,rootRef:I,iconColor:$e,onChange:E,autoContrast:Ge,mod:ie,attributes:de,...be}=o,b=ce(),ue=y||(b==null?void 0:b.size),P=F({name:"Checkbox",props:o,classes:se,className:n,style:a,classNames:c,styles:t,unstyled:l,attributes:de,vars:u,varsResolver:Ne}),{styleProps:xe,rest:R}=fe(be),J=me(p),M={checked:(b==null?void 0:b.value.includes(R.value))??x,onChange:L=>{b==null||b.onChange(L),E==null||E(L)},disabled:(b==null?void 0:b.disabled)??k},he=$.useRef(null),g=s||he;return $.useEffect(()=>{g&&"current"in g&&g.current&&(g.current.indeterminate=d||!1,d?g.current.setAttribute("data-indeterminate","true"):g.current.removeAttribute("data-indeterminate"))},[d,g]),e.jsx(ve,{...P("root"),__staticSelector:"Checkbox",__stylesApiProps:o,id:J,size:ue,labelPosition:m,label:h,description:S,error:w,disabled:M.disabled,classNames:c,styles:t,unstyled:l,"data-checked":M.checked||x||void 0,variant:T,ref:I,mod:ie,inert:R.inert,...xe,...f,children:e.jsxs(q,{...P("inner"),mod:{"data-label-position":m},children:[e.jsx(q,{component:"input",id:J,ref:g,mod:{error:!!w},...P("input",{focusable:!0,variant:T}),...R,...M,inert:R.inert,type:"checkbox"}),e.jsx(_,{indeterminate:d,...P("icon")})]})})});i.classes={...se,..._e};i.displayName="@mantine/core/Checkbox";i.Group=Y;i.Indicator=H;i.Card=K;var A,B,O;const Ke={title:"Mantine/Primitives/Checkbox",parameters:{skipCanvas:!0,layout:"fullscreen"}},N={render:(r,s)=>{var o,c;const n=(c=s==null||(o=s.globals)===null||o===void 0?void 0:o.locale)!==null&&c!==void 0?c:"en",a=t=>ge(n,`storybook.mantine.${t}`);return e.jsx(Ce,{children:e.jsxs(j,{gap:"xl",children:[e.jsxs(j,{gap:"xs",children:[e.jsx(z,{size:"xs",c:"gray.5",fw:500,children:"unchecked — gray-3 border / 16px box / 4px radius / label gray-7 / ≥44px tap target"}),e.jsx(i,{label:a("cb_label")})]}),e.jsxs(j,{gap:"xs",children:[e.jsx(z,{size:"xs",c:"gray.5",fw:500,children:"checked — brand-7 fill + white check mark; label unchanged"}),e.jsx(i,{label:a("cb_label"),defaultChecked:!0})]}),e.jsxs(j,{gap:"xs",children:[e.jsx(z,{size:"xs",c:"gray.5",fw:500,children:"focus — keyboard focus ring (brand, :focus-visible); no ring on mouse click"}),e.jsx(i,{label:a("cb_label")})]}),e.jsxs(j,{gap:"xs",children:[e.jsx(z,{size:"xs",c:"gray.5",fw:500,children:"error — red-6 border + ring (unchecked); checked+error → brand border wins (no red box)"}),e.jsx(i,{label:a("cb_label"),error:a("cb_error")}),e.jsx(i,{label:a("cb_label"),error:a("cb_error"),defaultChecked:!0})]}),e.jsxs(j,{gap:"xs",children:[e.jsx(z,{size:"xs",c:"gray.5",fw:500,children:"disabled — whole control faded (box + label → opacity 0.5); not-allowed; no focus ring"}),e.jsx(i,{label:a("cb_label"),disabled:!0}),e.jsx(i,{label:a("cb_label"),disabled:!0,defaultChecked:!0})]}),e.jsxs(j,{gap:"xs",children:[e.jsx(z,{size:"xs",c:"gray.5",fw:500,children:"long label — wraps to ≥2 lines at 320; no clip / no h-scroll at any locale (sq/en/uk/it)"}),e.jsx(i,{label:a("cb_long_label")})]})]})})}};N.parameters={...N.parameters,docs:{...(A=N.parameters)===null||A===void 0?void 0:A.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* 1 — unchecked: gray-3 border / 16px box / 4px radius / label gray-7 */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              unchecked — gray-3 border / 16px box / 4px radius / label gray-7 / ≥44px tap target\r
            </Text>\r
            <Checkbox label={t('cb_label')} />\r
          </Stack>\r
\r
          {/* 2 — checked: brand-7 fill + white check mark */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              checked — brand-7 fill + white check mark; label unchanged\r
            </Text>\r
            <Checkbox label={t('cb_label')} defaultChecked />\r
          </Stack>\r
\r
          {/* 3 — focus: keyboard focus ring (brand) — Tab to the checkbox to see */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              focus — keyboard focus ring (brand, :focus-visible); no ring on mouse click\r
            </Text>\r
            <Checkbox label={t('cb_label')} />\r
          </Stack>\r
\r
          {/* 4 — error: red-6 border + ring; checked+error → brand border wins */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              error — red-6 border + ring (unchecked); checked+error → brand border wins (no red box)\r
            </Text>\r
            <Checkbox label={t('cb_label')} error={t('cb_error')} />\r
            <Checkbox label={t('cb_label')} error={t('cb_error')} defaultChecked />\r
          </Stack>\r
\r
          {/* 5 — disabled: whole control faded — box + label → opacity 0.5 (§6f) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              disabled — whole control faded (box + label → opacity 0.5); not-allowed; no focus ring\r
            </Text>\r
            <Checkbox label={t('cb_label')} disabled />\r
            <Checkbox label={t('cb_label')} disabled defaultChecked />\r
          </Stack>\r
\r
          {/* 6 — long label: wraps ≥2 lines at 320; no clip / no h-scroll */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              long label — wraps to ≥2 lines at 320; no clip / no h-scroll at any locale (sq/en/uk/it)\r
            </Text>\r
            <Checkbox label={t('cb_long_label')} />\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(O=N.parameters)===null||O===void 0||(B=O.docs)===null||B===void 0?void 0:B.source}}};const Ye=["Default"];export{N as Default,Ye as __namedExportsOrder,Ke as default};
