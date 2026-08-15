import{j as o}from"./iframe-BWqC60Cj.js";import{B as D}from"./button-DqckHWPj.js";import{D as M,a as _,b as g,c as a,d as x}from"./dropdown-menu-D-E20Nhh.js";import{s as b}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./index-D4MQtXW4.js";import"./utils-D5ceN5oG.js";import"./useButton-62N7Qls-.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./mobile-bottom-sheet-tha1BKbV.js";import"./useInteractions-CUNok2Pe.js";import"./useTransitionStatus-C523vQjG.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./inertValue-DeE1CYDS.js";import"./visuallyHidden-COI6QeQH.js";import"./shadowDom-KUr5fxLu.js";import"./index-DTzEXCUc.js";import"./useOpenInteractionType-D7GLRI-3.js";import"./useValueChanged-DYbhOE3F.js";import"./DirectionContext-CtLbILH8.js";import"./useRole-BHvzd0LU.js";import"./getEmptyRootContext-CBnq-fR5.js";import"./getPseudoElementBounds-DoZBSa7U.js";import"./CompositeItem-HNATLU3Z.js";import"./useCompositeItem-D48be0U8.js";import"./CompositeList-S6-dMJcD.js";import"./useTriggerFocusGuards-BRKpHu-Z.js";import"./safePolygon-B3UYXLcm.js";import"./usePositioner-6ZAe_XXl.js";import"./useAnchoredPopupScrollLock-B9Vs29W1.js";var p,m,u,c,v,w;const Z={title:"Primitives/DropdownMenu",tags:["autodocs"],parameters:{docs:{description:{component:"Base-UI Menu primitive. At <640px renders as a full-width bottom sheet. Items are >=44px at mobile."}}}},n=(i,e="en")=>b(e,`storybook.dropdown.${i}`),d={render:(i,e)=>{var t,l;const r=(l=e==null||(t=e.globals)===null||t===void 0?void 0:t.locale)!==null&&l!==void 0?l:"en";return o.jsxs(M,{children:[o.jsx(_,{render:o.jsx(D,{children:n("open",r)})}),o.jsxs(g,{children:[o.jsx(a,{children:n("edit",r)}),o.jsx(a,{children:n("dup",r)}),o.jsx(x,{}),o.jsx(a,{variant:"destructive",children:n("del",r)})]})]})}},s={parameters:{docs:{description:{story:"@320: menu opens as a full-width bottom sheet — edge-to-edge, drag handle, items >=44px, long labels wrap. Use locale toolbar."}}},render:(i,e)=>{var t,l;const r=(l=e==null||(t=e.globals)===null||t===void 0?void 0:t.locale)!==null&&l!==void 0?l:"en";return o.jsx("div",{className:"p-4",children:o.jsxs(M,{defaultOpen:!0,children:[o.jsx(_,{render:o.jsx(D,{children:n("actions",r)})}),o.jsxs(g,{children:[o.jsx(a,{children:n("edit_long",r)}),o.jsx(a,{children:n("dup_long",r)}),o.jsx(x,{}),o.jsx(a,{variant:"destructive",children:n("del_long",r)})]})]})})},globals:{viewport:{value:"mobile320",isRotated:!1}}};d.parameters={...d.parameters,docs:{...(p=d.parameters)===null||p===void 0?void 0:p.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    return <DropdownMenu>\r
        <DropdownMenuTrigger render={<Button>{d("open", locale)}</Button>} />\r
        <DropdownMenuContent>\r
          <DropdownMenuItem>{d("edit", locale)}</DropdownMenuItem>\r
          <DropdownMenuItem>{d("dup", locale)}</DropdownMenuItem>\r
          <DropdownMenuSeparator />\r
          <DropdownMenuItem variant="destructive">{d("del", locale)}</DropdownMenuItem>\r
        </DropdownMenuContent>\r
      </DropdownMenu>;
  }
}`,...(u=d.parameters)===null||u===void 0||(m=u.docs)===null||m===void 0?void 0:m.source}}};s.parameters={...s.parameters,docs:{...(c=s.parameters)===null||c===void 0?void 0:c.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: "@320: menu opens as a full-width bottom sheet — edge-to-edge, drag handle, items >=44px, long labels wrap. Use locale toolbar."
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    return <div className="p-4">\r
        <DropdownMenu defaultOpen>\r
          <DropdownMenuTrigger render={<Button>{d("actions", locale)}</Button>} />\r
          <DropdownMenuContent>\r
            <DropdownMenuItem>{d("edit_long", locale)}</DropdownMenuItem>\r
            <DropdownMenuItem>{d("dup_long", locale)}</DropdownMenuItem>\r
            <DropdownMenuSeparator />\r
            <DropdownMenuItem variant="destructive">{d("del_long", locale)}</DropdownMenuItem>\r
          </DropdownMenuContent>\r
        </DropdownMenu>\r
      </div>;
  },
  globals: {
    viewport: {
      value: "mobile320",
      isRotated: false
    }
  }
}`,...(w=s.parameters)===null||w===void 0||(v=w.docs)===null||v===void 0?void 0:v.source}}};const oo=["Default","MobileBottomSheet"];export{d as Default,s as MobileBottomSheet,oo as __namedExportsOrder,Z as default};
