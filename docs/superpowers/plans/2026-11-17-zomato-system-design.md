# Zomato System Design Implementation Plan

> **For agentic workers:** This is a browser-artifact task; execute the checked steps in Eraser and verify the rendered diagram before handoff.

**Goal:** Recreate the supplied Zomato system-design architecture as an editable Eraser diagram with recognizable infrastructure and domain icons.

**Architecture:** Preserve the reference’s left-to-right flow: Client/Restaurant/Rider actors enter through an API Gateway; search, restaurant, and order services connect to storage and event-processing components; rider-location, notification, ranking, CDC, semantic-search, and indexing components complete the flow. Use native editable Eraser nodes and connectors, with icon-bearing nodes where available.

**Tech Stack:** Eraser browser workspace; native diagram shapes/connectors; built-in icon/library picker where available.

**Spec:** Supplied reference images `C:\Users\roybe\.codex\attachments\bfd34f08-2e63-486c-b02c-743a5f63be9c\image-1.png` and `image-2.png` plus the user requirement to use actual icons for the relevant components.

## Global Constraints

- Title the artifact `Zomato System Design`.
- Keep the diagram editable; do not use the reference image as the final artifact.
- Use recognizable icons for databases, Kafka/event streaming, Elasticsearch/search, users/actors, location, notifications, and distributed locking where Eraser provides them.
- Preserve the reference labels and relationships, correcting only obvious readability issues.
- Do not share or publish the workspace.

## Review Focus

- Reference fidelity: all major services, stores, actors, and flows from the images are present.
- Icon semantics: a database looks like a database, Kafka like event streaming, and Elasticsearch like search/indexing.
- Connector direction: arrows point in the same logical direction as the reference.
- Readability: labels do not overlap nodes or connectors at the final zoom.
- Editability: nodes remain individually selectable/editable rather than flattened into an image.

### Task 1: Create the editable Zomato architecture diagram

**Files:**
- Modify: Eraser workspace file currently open in the browser.

**Interfaces:**
- Consumes: the two supplied reference images and this plan.
- Produces: an editable Eraser diagram titled `Zomato System Design`.

- [ ] Add the title and main actor/service/storage nodes, using appropriate native shapes and icons.
- [ ] Add connectors and route labels for `/search`, `/restaurant/close`, `/order`, `/ride`, `/riderLocation`, `/getRiderLocation`, `/createRide`, hot changes, rider registration, delivery prompt, and order notification.
- [ ] Add the data annotations for User, Order, Restaurant, Rider, Rides, and zone ranking shown in the reference.
- [ ] Align and space the diagram so the primary flow is readable without overlapping labels.
- [ ] Inspect the final canvas and confirm that the diagram is editable and visually matches the reference structure.

### Task 2: Verify the final browser artifact

**Files:**
- Verify: the Eraser workspace file.

- [ ] Confirm the title, major nodes, actual icons, and connector directions are visible.
- [ ] Confirm no reference image is being used as the final flattened artifact.
- [ ] Leave the Eraser workspace open for the user.
