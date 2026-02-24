import '@ui5/webcomponents-fiori/dist/DynamicPage.js';
import '@ui5/webcomponents-fiori/dist/DynamicPageHeader.js';
import '@ui5/webcomponents-fiori/dist/DynamicPageTitle.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Breadcrumbs.js';
import '@ui5/webcomponents/dist/BreadcrumbsItem.js';
import '@ui5/webcomponents/dist/Bar.js';
import '@ui5/webcomponents/dist/Toolbar.js';
import '@ui5/webcomponents/dist/ToolbarButton.js';
import '@ui5/webcomponents/dist/List.js';
import '@ui5/webcomponents/dist/ListItem.js';
import '@ui5/webcomponents/dist/Label.js';
import '@ui5/webcomponents/dist/Title.js';
import '@ui5/webcomponents/dist/Tag.js';
import '@ui5/webcomponents/dist/Avatar.js';
import '@ui5/webcomponents-icons/AllIcons.js';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<ui5-dynamic-page id="page" show-footer>
  <ui5-dynamic-page-title slot="titleArea">
    <ui5-breadcrumbs slot="breadcrumbs">
      <ui5-breadcrumbs-item href="#">Man</ui5-breadcrumbs-item>
      <ui5-breadcrumbs-item href="#">Shoes</ui5-breadcrumbs-item>
      <ui5-breadcrumbs-item href="#">Running Shoes</ui5-breadcrumbs-item>
    </ui5-breadcrumbs>

    <ui5-title slot="heading">Special Running Shoe</ui5-title>

    <div slot="snappedHeading" class="snapped-title-heading">
      <ui5-avatar shape="square" icon="laptop" color-scheme="Accent5" size="S"></ui5-avatar>
      <ui5-title wrapping-type="None">Special Running Shoe</ui5-title>
    </div>

    <p slot="subheading" class="text">PO-48865</p>
    <p slot="snappedSubheading" class="text">PO-48865</p>

    <ui5-tag color-scheme="7" wrapping-type="None">Special 157.4M EUR</ui5-tag>

    <ui5-toolbar class="actionsBar" id="actionsToolbar" slot="actionsBar" design="Transparent">
      <ui5-toolbar-button text="Create"></ui5-toolbar-button>
      <ui5-toolbar-button id="edit-button" design="Transparent" text="Edit"></ui5-toolbar-button>
      <ui5-toolbar-button design="Transparent" text="Paste"></ui5-toolbar-button>
    </ui5-toolbar>

    <ui5-toolbar class="navigationBar" slot="navigationBar" design="Transparent">
      <ui5-toolbar-button design="Transparent" icon="share"></ui5-toolbar-button>
      <ui5-toolbar-button design="Transparent" icon="action-settings"></ui5-toolbar-button>
    </ui5-toolbar>
  </ui5-dynamic-page-title>

  <ui5-dynamic-page-header slot="headerArea">
    <div class="product-info">
      <ui5-avatar id="avatar" shape="square" icon="laptop" color-scheme="Accent5" size="L"></ui5-avatar>
      <div class="product-info-cell">
        <ui5-label>Availability</ui5-label>
        <p class="text availability">In Stock</p>
      </div>
      <div class="product-info-cell">
        <ui5-label>Price</ui5-label>
        <p class="text price">379.99 USD</p>
      </div>
      <div class="product-info-cell">
        <ui5-label>Product Description</ui5-label>
        <p class="text product-description">Super-lightweight cushioning propels you forward from landing to
          toe-off and has a fast, snappy feel.</p>
      </div>
    </div>
  </ui5-dynamic-page-header>

  <ui5-list header-text="Products (13)" mode="SingleSelect">
    <ui5-li description="HT-2001" icon="slim-arrow-right" icon-end additional-text="47.00 EUR">10 inch Portable
      DVD</ui5-li>
    <ui5-li description="HT-2001" icon="slim-arrow-right" icon-end additional-text="249.00 EUR">7 inch
      WidescreenPortable DVD Player w MP3</ui5-li>
    <ui5-li description="HT-1251" icon="slim-arrow-right" icon-end additional-text="947.00 EUR">Astro Laptop
      1516</ui5-li>
  </ui5-list>

  <ui5-bar slot="footerArea" design="FloatingFooter">
    <ui5-button id="save-edit" slot="endContent" design="Emphasized">Save</ui5-button>
    <ui5-button id="cancel-edit" slot="endContent">Close</ui5-button>
  </ui5-bar>
</ui5-dynamic-page>
`;
