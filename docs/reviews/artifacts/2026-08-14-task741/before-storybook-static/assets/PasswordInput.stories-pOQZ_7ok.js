import{j as e,r as C}from"./iframe-BWqC60Cj.js";import{P as n}from"./PasswordInput-ADwWGZl8.js";import{P as N}from"./PasswordRequirementsHint-Gwiuvsiu.js";import{B as F}from"./button-DqckHWPj.js";import{L as U}from"./label-DYC-YT_p.js";import{s as z}from"./_storyI18n-DUPbxmag.js";import{a as V}from"./passwordRules-CYUcrpGI.js";import{n as B}from"./index-PXfbuUw3.js";import"./preload-helper-Dp1pzeXC.js";import"./utils-D5ceN5oG.js";import"./input-ByZEYirH.js";import"./useControlled-COCwHvrc.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./shadowDom-KUr5fxLu.js";import"./useRegisterFieldControl-DQI04whl.js";import"./useLabelableId-DofIhODs.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./eye-off-B8Q0VpJu.js";import"./createLucideIcon-DZTr3VOw.js";import"./eye-B-khOYU_.js";import"./check-BHCgvXo2.js";import"./x-oNeZx8ai.js";import"./index-D4MQtXW4.js";import"./useButton-62N7Qls-.js";var h,b,g,w,x,S,f,y,j,k,R,H,I,W,M,A,D,P,E,L,T;const ge={title:"Primitives/PasswordInput",component:n,tags:["autodocs"],parameters:{},argTypes:{inputState:{control:"select",options:["idle","error","success"]},disabled:{control:"boolean"}}},d={render:(s,o)=>{var t,r;const a=(r=o==null||(t=o.globals)===null||t===void 0?void 0:t.locale)!==null&&r!==void 0?r:"en";return e.jsx(n,{placeholder:z(a,"storybook.passwordinput.placeholder"),inputState:"idle"})}},c={render:(s,o)=>{var t,r;const a=(r=o==null||(t=o.globals)===null||t===void 0?void 0:t.locale)!==null&&r!==void 0?r:"en";return e.jsx(n,{placeholder:z(a,"storybook.passwordinput.placeholder"),inputState:"error"})}},p={render:(s,o)=>{var t,r;const a=(r=o==null||(t=o.globals)===null||t===void 0?void 0:t.locale)!==null&&r!==void 0?r:"en";return e.jsx(n,{placeholder:z(a,"storybook.passwordinput.placeholder"),inputState:"success",value:"Sample123!"})}},u={args:{disabled:!0,value:"locked-password"}};function q(){const[s,o]=C.useState(""),t=s.length>0,r=V(s),a=t?r?"success":"error":"idle",l=B("auth");return e.jsxs("div",{className:"flex flex-col gap-2 w-80",children:[e.jsx(U,{htmlFor:"story-pass",children:l("reset_password_new_label")}),e.jsx(n,{id:"story-pass",value:s,onChange:i=>o(i.target.value),autoComplete:"new-password",inputState:a}),e.jsx(N,{value:s}),e.jsx(F,{size:"xl",className:"w-full mt-2",disabled:!r,children:l("reset_password_submit")})]})}const m={render:()=>e.jsx(q,{}),parameters:{docs:{description:{story:"Full password-with-hint form. Type to see live rule validation."}}}};function O(){const[s,o]=C.useState("Sample123!"),t=s.length>0,r=V(s),a=t?r?"success":"error":"idle",l=B("auth");return e.jsxs("div",{className:"flex flex-col gap-2 w-80",children:[e.jsx(U,{htmlFor:"story-pass-ok",children:l("reset_password_new_label")}),e.jsx(n,{id:"story-pass-ok",value:s,onChange:i=>o(i.target.value),autoComplete:"new-password",inputState:a}),e.jsx(N,{value:s}),e.jsx(F,{size:"xl",className:"w-full mt-2",disabled:!r,children:l("reset_password_submit")})]})}const _={render:()=>e.jsx(O,{}),parameters:{docs:{description:{story:"All 5 rules met — green border, all check marks, button enabled."}}}};function G(){const[s,o]=C.useState("Abc1!"),t=s.length>0,r=V(s),a=t?r?"success":"error":"idle",l=B("auth");return e.jsxs("div",{className:"flex flex-col gap-2 w-full p-4",children:[e.jsx(U,{htmlFor:"story-uk",children:l("reset_password_new_label")}),e.jsx(n,{id:"story-uk",value:s,onChange:i=>o(i.target.value),autoComplete:"new-password",inputState:a}),e.jsx(N,{value:s}),e.jsx(F,{size:"xl",className:"w-full mt-2",disabled:!r,children:l("reset_password_submit")})]})}const v={render:()=>e.jsx(G,{}),parameters:{docs:{description:{story:"320px Ukrainian — longest strings, rule rows wrap gracefully."}}},globals:{viewport:{value:"mobile320",isRotated:!1}}};d.parameters={...d.parameters,docs:{...(h=d.parameters)===null||h===void 0?void 0:h.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <PasswordInput placeholder={storyT(locale, 'storybook.passwordinput.placeholder')} inputState="idle" />;
  }
}`,...(g=d.parameters)===null||g===void 0||(b=g.docs)===null||b===void 0?void 0:b.source}}};c.parameters={...c.parameters,docs:{...(w=c.parameters)===null||w===void 0?void 0:w.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <PasswordInput placeholder={storyT(locale, 'storybook.passwordinput.placeholder')} inputState="error" />;
  }
}`,...(S=c.parameters)===null||S===void 0||(x=S.docs)===null||x===void 0?void 0:x.source}}};p.parameters={...p.parameters,docs:{...(f=p.parameters)===null||f===void 0?void 0:f.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <PasswordInput placeholder={storyT(locale, 'storybook.passwordinput.placeholder')} inputState="success" value="Sample123!" />;
  }
}`,...(j=p.parameters)===null||j===void 0||(y=j.docs)===null||y===void 0?void 0:y.source}}};u.parameters={...u.parameters,docs:{...(k=u.parameters)===null||k===void 0?void 0:k.docs,source:{originalSource:`{
  args: {
    disabled: true,
    value: 'locked-password'
  }
}`,...(H=u.parameters)===null||H===void 0||(R=H.docs)===null||R===void 0?void 0:R.source}}};m.parameters={...m.parameters,docs:{...(I=m.parameters)===null||I===void 0?void 0:I.docs,source:{originalSource:`{
  render: () => <WithHintIdleRender />,
  parameters: {
    docs: {
      description: {
        story: 'Full password-with-hint form. Type to see live rule validation.'
      }
    }
  }
}`,...(M=m.parameters)===null||M===void 0||(W=M.docs)===null||W===void 0?void 0:W.source}}};_.parameters={..._.parameters,docs:{...(A=_.parameters)===null||A===void 0?void 0:A.docs,source:{originalSource:`{
  render: () => <WithHintAllRulesMetRender />,
  parameters: {
    docs: {
      description: {
        story: 'All 5 rules met — green border, all check marks, button enabled.'
      }
    }
  }
}`,...(P=_.parameters)===null||P===void 0||(D=P.docs)===null||D===void 0?void 0:D.source}}};v.parameters={...v.parameters,docs:{...(E=v.parameters)===null||E===void 0?void 0:E.docs,source:{originalSource:`{
  render: () => <Mobile320UkrainianRender />,
  parameters: {
    docs: {
      description: {
        story: '320px Ukrainian — longest strings, rule rows wrap gracefully.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(T=v.parameters)===null||T===void 0||(L=T.docs)===null||L===void 0?void 0:L.source}}};const we=["Default","ErrorState","SuccessState","Disabled","WithHintIdle","WithHintAllRulesMet","LocaleStress"];export{d as Default,u as Disabled,c as ErrorState,v as LocaleStress,p as SuccessState,_ as WithHintAllRulesMet,m as WithHintIdle,we as __namedExportsOrder,ge as default};
