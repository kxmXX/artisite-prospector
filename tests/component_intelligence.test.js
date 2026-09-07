import test from "node:test";
import assert from "node:assert/strict";
import {
  COMPONENT_FAMILIES,
  COMPONENT_STATES,
  COMPONENT_INTELLIGENCE_REGISTRY,
  ComponentSelectionEngine,
  UI_COMPOSITION_POLICIES,
  evaluateCompositionPolicy,
  TRADE_COMPONENT_MATRIX,
  getRecommendedComponentsForTrade,
  evaluateResponsiveTransform,
  verifyAccessibility,
  calculateComponentConfidence,
  detectAntiPatterns,
  createComponentInstance,
  copilotComponentReasoning
} from "../public/js/engine/componentIntelligence.js";
import { renderInspector } from "../public/js/components/inspector.js";
import { generateSite } from "../public/js/engine/generator.js";

test("Component Intelligence: Canonical Families and Registry Integrity", () => {
  assert.equal(COMPONENT_FAMILIES.length, 12);
  assert.ok(COMPONENT_FAMILIES.includes("action"));
  assert.ok(COMPONENT_FAMILIES.includes("selection"));
  assert.ok(COMPONENT_FAMILIES.includes("disclosure"));
  assert.ok(COMPONENT_FAMILIES.includes("overlay"));
  assert.ok(COMPONENT_FAMILIES.includes("feedback"));

  assert.ok(COMPONENT_STATES.includes("default"));
  assert.ok(COMPONENT_STATES.includes("hover"));
  assert.ok(COMPONENT_STATES.includes("focus"));
  assert.ok(COMPONENT_STATES.includes("disabled"));
  assert.ok(COMPONENT_STATES.includes("loading"));

  // Check registry items
  const requiredComponents = ["button", "buttonGroup", "link", "toggle", "checkbox", "radioButton", "select", "segmentedControl", "slider", "textInput", "textarea", "form", "header", "tabs", "accordion", "popover", "tooltip", "drawer", "modal", "alert", "toast", "badge", "card", "hero", "carousel"];
  for (const id of requiredComponents) {
    const comp = COMPONENT_INTELLIGENCE_REGISTRY[id];
    assert.ok(comp, `Composant canonique ${id} manquant dans le registre`);
    assert.ok(comp.family, `Famille manquante pour ${id}`);
    assert.ok(Array.isArray(comp.intent), `Intent manquant pour ${id}`);
    assert.ok(Array.isArray(comp.variants), `Variantes manquantes pour ${id}`);
    assert.ok(comp.responsivePolicy, `Politique responsive manquante pour ${id}`);
    assert.ok(comp.accessibilityPolicy, `Politique a11y manquante pour ${id}`);
  }
});

test("Component Intelligence: Selection Rules 5.1 to 5.7", () => {
  // 5.1 Action
  const primaryAction = ComponentSelectionEngine.recommendActionComponent({ isPrimary: true });
  assert.equal(primaryAction.component, "button");
  assert.equal(primaryAction.variant, "primary");

  const secondaryAction = ComponentSelectionEngine.recommendActionComponent({ isSecondary: true });
  assert.equal(secondaryAction.component, "button");
  assert.equal(secondaryAction.variant, "secondary");

  const tertiaryAction = ComponentSelectionEngine.recommendActionComponent({ isTertiary: true });
  assert.equal(tertiaryAction.component, "link");

  const groupedAction = ComponentSelectionEngine.recommendActionComponent({ isGrouped: true });
  assert.equal(groupedAction.component, "buttonGroup");

  // 5.2 Single choice
  const viewSwitch = ComponentSelectionEngine.recommendSelectionComponent({ optionCount: 3, isEquivalentViews: true });
  assert.equal(viewSwitch.component, "segmentedControl");

  const compareChoice = ComponentSelectionEngine.recommendSelectionComponent({ optionCount: 3, needComparison: true });
  assert.equal(compareChoice.component, "radioButton");

  const searchableChoice = ComponentSelectionEngine.recommendSelectionComponent({ optionCount: 20, isSearchable: true });
  assert.equal(searchableChoice.component, "combobox");

  const defaultSelect = ComponentSelectionEngine.recommendSelectionComponent({ optionCount: 8, needComparison: false });
  assert.equal(defaultSelect.component, "select");

  // 5.3 Multiple choice & Binary
  const instantToggle = ComponentSelectionEngine.recommendMultipleChoiceComponent({ isBinary: true, isImmediateStateChange: true });
  assert.equal(instantToggle.component, "toggle");

  const formCheckbox = ComponentSelectionEngine.recommendMultipleChoiceComponent({ isBinary: true, isImmediateStateChange: false });
  assert.equal(formCheckbox.component, "checkbox");
  assert.equal(formCheckbox.variant, "standard");

  const multiChoices = ComponentSelectionEngine.recommendMultipleChoiceComponent({ isBinary: false, optionsCount: 5 });
  assert.equal(multiChoices.component, "checkbox");
  assert.equal(multiChoices.variant, "card-checkbox");

  // 5.4 Navigation
  const globalNav = ComponentSelectionEngine.recommendNavigationComponent({ isGlobal: true });
  assert.equal(globalNav.component, "header");

  const subNav = ComponentSelectionEngine.recommendNavigationComponent({ isSameContext: true });
  assert.equal(subNav.component, "tabs");

  const deepNav = ComponentSelectionEngine.recommendNavigationComponent({ depth: 3 });
  assert.equal(deepNav.component, "breadcrumbs");

  // 5.5 Dense content
  const faqContent = ComponentSelectionEngine.recommendDenseContentComponent({ isCollapsibleSecondary: true });
  assert.equal(faqContent.component, "accordion");

  const stepProcess = ComponentSelectionEngine.recommendDenseContentComponent({ isSteps: true });
  assert.equal(stepProcess.component, "progressIndicator");

  const cardServices = ComponentSelectionEngine.recommendDenseContentComponent({ isDiscreteEntities: true });
  assert.equal(cardServices.component, "card");

  // 5.6 Feedback & Non-blocking
  const urgentAlert = ComponentSelectionEngine.recommendFeedbackComponent({ isImportantPersistent: true });
  assert.equal(urgentAlert.component, "alert");

  const quickToast = ComponentSelectionEngine.recommendFeedbackComponent({ isTemporaryConfirmation: true });
  assert.equal(quickToast.component, "toast");

  const trustBadge = ComponentSelectionEngine.recommendFeedbackComponent({ isCompactStatus: true });
  assert.equal(trustBadge.component, "badge");

  // 5.7 Overlay vs Inline
  const blockingModal = ComponentSelectionEngine.recommendOverlayComponent({ mustBlockDecision: true });
  assert.equal(blockingModal.component, "modal");

  const sideDrawer = ComponentSelectionEngine.recommendOverlayComponent({ isSecondaryContext: true });
  assert.equal(sideDrawer.component, "drawer");

  const anchorPopover = ComponentSelectionEngine.recommendOverlayComponent({ isLocalDetail: true });
  assert.equal(anchorPopover.component, "popover");
});

test("Component Intelligence: UI Composition Policies (Level A Landing vs Level B Editor)", () => {
  const landingPolicy = UI_COMPOSITION_POLICIES.landingPage;
  const editorPolicy = UI_COMPOSITION_POLICIES.internalEditor;

  assert.equal(landingPolicy.pageType, "landing");
  assert.equal(landingPolicy.goal, "conversion");
  assert.equal(landingPolicy.maxPrimaryActionsPerViewport, 1);

  assert.equal(editorPolicy.pageType, "editor");
  assert.equal(editorPolicy.goal, "workflow");

  // Test valid landing composition
  const validLanding = evaluateCompositionPolicy(landingPolicy, ["hero", "card", "button", "accordion", "badge", "form"]);
  assert.equal(validLanding.valid, true);
  assert.equal(validLanding.score, 100);

  // Test landing composition with discouraged complex components (table, treeView)
  const invalidLanding = evaluateCompositionPolicy(landingPolicy, ["hero", "button", "table", "treeView"]);
  assert.equal(invalidLanding.valid, false);
  assert.ok(invalidLanding.violations.length >= 2);
  assert.ok(invalidLanding.score < 100);
});

test("Component Intelligence: Trade Matrix recommendations", () => {
  const paysagiste = getRecommendedComponentsForTrade("paysagiste");
  assert.ok(paysagiste.priorityComponents.includes("carousel"));
  assert.ok(paysagiste.priorityComponents.includes("hero"));

  const plombier = getRecommendedComponentsForTrade("plombier");
  assert.ok(plombier.priorityComponents.includes("alert"));
  assert.ok(plombier.priorityComponents.includes("button"));
  assert.ok(plombier.corePatterns.includes("urgence-24-7"));

  const restaurant = getRecommendedComponentsForTrade("restaurant");
  assert.ok(restaurant.priorityComponents.includes("tabs"));
  assert.ok(restaurant.corePatterns.includes("carte-du-jour"));
});

test("Component Intelligence: Adaptive Responsive Transform", () => {
  const headerMobile = evaluateResponsiveTransform("header", "mobile");
  assert.equal(headerMobile, "burger-sheet-with-direct-call");

  const headerDesktop = evaluateResponsiveTransform("header", "desktop");
  assert.equal(headerDesktop, "full-horizontal-nav");

  const modalMobile = evaluateResponsiveTransform("modal", "mobile");
  assert.equal(modalMobile, "bottom-sheet-full-touch");

  const buttonGroupMobile = evaluateResponsiveTransform("buttonGroup", "mobile");
  assert.equal(buttonGroupMobile, "stacked-full-width");
});

test("Component Intelligence: Accessibility Validation", () => {
  // Valid component with accessible label
  const validButton = verifyAccessibility({
    type: "button",
    content: { label: "Demander un devis" }
  });
  assert.equal(validButton.compliant, true);
  assert.equal(validButton.errors.length, 0);

  // Invalid button missing label
  const invalidButton = verifyAccessibility({
    type: "button",
    content: {}
  });
  assert.equal(invalidButton.compliant, false);
  assert.ok(invalidButton.errors.some(e => e.includes("libellé textuel")));

  // Invalid input using placeholder without label
  const invalidInput = verifyAccessibility({
    type: "textInput",
    props: { placeholder: "Entrez votre nom" }
  });
  assert.equal(invalidInput.compliant, false);
  assert.ok(invalidInput.errors.some(e => e.includes("placeholder ne peut pas remplacer le label")));
});

test("Component Intelligence: Confidence Score Formula", () => {
  const confidence = calculateComponentConfidence("hero", { tradeId: "paysagiste", pageType: "landing" });
  assert.ok(confidence.score >= 80);
  assert.equal(confidence.recommendation, "suggest-auto");
  assert.ok(confidence.metrics.usageFit);
  assert.ok(confidence.metrics.accessibilityConfidence);
  assert.ok(confidence.metrics.responsiveConfidence);
  assert.ok(confidence.metrics.contentFit);
  assert.ok(confidence.metrics.implementationSimplicity);

  const lowConfidence = calculateComponentConfidence("table", { tradeId: "paysagiste", pageType: "landing" });
  assert.ok(lowConfidence.score < 60);
  assert.equal(lowConfidence.recommendation, "do-not-inject");
});

test("Component Intelligence: Anti-Patterns Detection", () => {
  // 1. Component dumping (>14 components on landing)
  const dumpedList = new Array(16).fill("card");
  const dumping = detectAntiPatterns(dumpedList, { pageType: "landing" });
  assert.ok(dumping.some(p => p.pattern === "component-dumping"));

  // 2. Modal inflation (>2 modals)
  const modalHeavyList = ["modal", "modal", "modal"];
  const modalInflation = detectAntiPatterns(modalHeavyList, { pageType: "landing" });
  assert.ok(modalInflation.some(p => p.pattern === "modal-inflation"));

  // 3. Fake complexity (table or treeView on landing)
  const fakeComplex = ["hero", "card", "treeView"];
  const complexityFlag = detectAntiPatterns(fakeComplex, { pageType: "landing" });
  assert.ok(complexityFlag.some(p => p.pattern === "fake-complexity"));
});

test("Component Intelligence: Universal Component Instance Contract", () => {
  const instance = createComponentInstance({
    type: "button",
    variant: "primary",
    content: { label: "Appeler maintenant" },
    analytics: { event: "click_call", metadata: { trade: "plombier" } }
  });

  assert.ok(instance.id.startsWith("comp_"));
  assert.equal(instance.type, "button");
  assert.equal(instance.variant, "primary");
  assert.equal(instance.content.label, "Appeler maintenant");
  assert.equal(instance.analytics.event, "click_call");
  assert.ok(instance.createdAt);
});

test("Component Intelligence: Copilot Reasoning", () => {
  const faqReasoning = copilotComponentReasoning("ajoute des questions fréquentes pour rassurer", "paysagiste");
  assert.equal(faqReasoning.component, "accordion");
  assert.equal(faqReasoning.family, "disclosure");

  const urgenceReasoning = copilotComponentReasoning("mets en avant le dépannage d'urgence 24/7", "plombier");
  assert.equal(urgenceReasoning.component, "alert");
  assert.equal(urgenceReasoning.family, "feedback");

  const beforeAfterReasoning = copilotComponentReasoning("on veut un comparateur glissant avant après", "paysagiste");
  assert.equal(beforeAfterReasoning.component, "carousel");
  assert.equal(beforeAfterReasoning.family, "media");
});

test("Component Intelligence: Inspector panel integrates Component Intelligence card", () => {
  const site = generateSite({ name: "Jardins de France", tradeId: "paysagiste" });
  const heroSection = site.sections.find(s => s.type === "hero");
  
  const inspectorHtml = renderInspector(heroSection, site, {});
  assert.ok(inspectorHtml.includes("Intelligence Composant"), "Le titre Intelligence Composant doit être affiché");
  assert.ok(inspectorHtml.includes("Score:"), "Le score de confiance doit être affiché");
  assert.ok(inspectorHtml.includes("Accessibilité"), "Le bloc d'accessibilité doit être présent");
  assert.ok(inspectorHtml.includes("Tag Analytics:"), "Le tag analytics doit être présent");
  assert.ok(inspectorHtml.includes("track-hero"), "Le tag track-hero doit être présent");
});
