import{j as l}from"./iframe-BWqC60Cj.js";import{S as u}from"./SimilarListingsView-ebU-pAz-.js";import{m as v}from"./cardListingData.fixture-Cbf1gyx4.js";import{s as _}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./ListingCard-D-8xd9nT.js";import"./index-C8MEBqML.js";import"./AppImage--686g1R4.js";import"./utils-D5ceN5oG.js";import"./RangeDatePicker-Dt_rNT9t.js";import"./SimpleGrid-KrH1v0nV.js";import"./Text-ZiglToyN.js";import"./Avatar-B1u-IzMg.js";import"./Stack-DqzY2ynC.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import"./index-DUUQ4TXw.js";import"./formatters-BY5HUnlf.js";import"./propertyTypeSchema-BIt1KfNL.js";import"./listingSemanticHelpers-Bf38nK5_.js";import"./building-2-9lGYKeUs.js";import"./bed-double-BYKhWOuE.js";import"./house-mS3JtSOa.js";import"./FavoriteButton-DSjl02rU.js";import"./index-hdwsiLj7.js";import"./server-DtWDQ7N5.js";import"./warnDeprecatedPackage-SJ_BeofI.js";import"./server-D4e9MQwo.js";import"./blockCheck-gQteVmNI.js";import"./admin-OMykPQmP.js";import"./routing-CZLtcx05.js";import"./client-CtwMRmlX.js";import"./toast-DoA0WQwD.js";import"./heart-D83DUq8K.js";var m,p,n,c,d,g;const Di={title:"System/SimilarListings",tags:["autodocs"],parameters:{docs:{description:{component:"Similar listings grid — public listing-detail section. Canonical §8.3 card grid: grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4. Statically imports the real production `SimilarListingsView` (Task 665)."}}}},x={ALL:1,EUR:100},s={render:(y,i)=>{var o,r;const t=(r=i==null||(o=i.globals)===null||o===void 0?void 0:o.locale)!==null&&r!==void 0?r:"en",a=v(t);return l.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:l.jsx(u,{heading:_(t,"listing.similar_listings"),listings:a,rates:x,displayCurrency:"EUR"})})},parameters:{docs:{description:{story:"Exercises the §8.3 column step across breakpoints: 1 col (<640) → 2 cols (sm) → 3 cols (xl, 1280px) → 4 cols (2xl, 1536px)."}}},globals:{viewport:{value:"desktop1280",isRotated:!1}}},e={render:(y,i)=>{var o,r;const t=(r=i==null||(o=i.globals)===null||o===void 0?void 0:o.locale)!==null&&r!==void 0?r:"en",a=v(t).slice(0,4);return l.jsx("div",{className:"container-wide mx-auto px-4 py-8",children:l.jsx(u,{heading:_(t,"listing.similar_listings"),listings:a,rates:x,displayCurrency:"EUR"})})},parameters:{docs:{description:{story:"@320: longest locale titles — verify line-clamp-2, no horizontal overflow. Use the locale toolbar for sq/en/uk/it."}}},globals:{viewport:{value:"mobile320",isRotated:!1}}};s.parameters={...s.parameters,docs:{...(m=s.parameters)===null||m===void 0?void 0:m.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const listings = makeCardListingFixtures(locale);
    return <div className="container-wide mx-auto px-4 py-8">\r
        <SimilarListingsView heading={storyT(locale, 'listing.similar_listings')} listings={listings} rates={FIXTURE_RATES} displayCurrency="EUR" />\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Exercises the §8.3 column step across breakpoints: 1 col (<640) → 2 cols (sm) → 3 cols (xl, 1280px) → 4 cols (2xl, 1536px).'
      }
    }
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(n=s.parameters)===null||n===void 0||(p=n.docs)===null||p===void 0?void 0:p.source}}};e.parameters={...e.parameters,docs:{...(c=e.parameters)===null||c===void 0?void 0:c.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const listings = makeCardListingFixtures(locale).slice(0, 4);
    return <div className="container-wide mx-auto px-4 py-8">\r
        <SimilarListingsView heading={storyT(locale, 'listing.similar_listings')} listings={listings} rates={FIXTURE_RATES} displayCurrency="EUR" />\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: '@320: longest locale titles — verify line-clamp-2, no horizontal overflow. Use the locale toolbar for sq/en/uk/it.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(g=e.parameters)===null||g===void 0||(d=g.docs)===null||d===void 0?void 0:d.source}}};const Ai=["Default","LocaleStress"];export{s as Default,e as LocaleStress,Ai as __namedExportsOrder,Di as default};
