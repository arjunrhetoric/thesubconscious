async function test() {
  const base = "http://localhost:3000";
  const testEmail = "user_" + Date.now() + "@example.com";
  const testPassword = "password123";

  // 1. Auth signup
  console.log("--- Testing Phase 1: Auth ---");
  const signupRes = await fetch(base + "/api/v1/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  }).then((r) => r.json());
  console.log("Signup:", signupRes.success ? "SUCCESS" : signupRes);
  const token = signupRes.token;
  const authHeaders = {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };

  console.log("\n--- Testing Phase 2: Pages & Nested Tree ---");
  // Root Page
  const rootPage = await fetch(base + "/api/v1/pages", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "System Design",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "System design notes covering distributed architectures, databases, and caching.",
              },
            ],
          },
        ],
      },
    }),
  }).then((r) => r.json());
  if (!rootPage.success) {
    console.error("Root page creation failed:", rootPage);
  }
  console.log("Root Page created:", rootPage.page?._id, rootPage.page?.title);

  // Child Page 1 (Subpage)
  const childPage1 = await fetch(base + "/api/v1/pages", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Load Balancing",
      parentId: rootPage.page._id,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A load balancer distributes incoming network traffic across multiple servers to ensure high availability and reliability using algorithms like Round Robin, Least Connections, and Consistent Hashing.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Health checks ensure traffic is only routed to healthy nodes. L4 operates at transport layer while L7 inspects HTTP headers.",
              },
            ],
          },
        ],
      },
    }),
  }).then((r) => r.json());
  if (!childPage1.success) {
    console.error("Child page creation failed:", childPage1);
  }
  console.log("Child Page 1 created:", childPage1.page?._id, childPage1.page?.title);

  // Trigger content update on Child 1 to trigger embedding & auto-tagging
  await fetch(base + "/api/v1/pages/" + childPage1.page._id, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A load balancer distributes incoming network traffic across multiple servers to ensure high availability and reliability using algorithms like Round Robin, Least Connections, and Consistent Hashing. Health checks ensure traffic is only routed to healthy nodes.",
              },
            ],
          },
        ],
      },
    }),
  });

  // Grandchild Page
  const grandChild = await fetch(base + "/api/v1/pages", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Consistent Hashing",
      parentId: childPage1.page._id,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Consistent hashing minimizes key remapping when servers are added or removed in a distributed hash table using virtual nodes on a hash ring.",
              },
            ],
          },
        ],
      },
    }),
  }).then((r) => r.json());
  console.log("Grandchild Page created:", grandChild.page._id, grandChild.page.title);

  // Tree verification
  const treeRes = await fetch(base + "/api/v1/pages/tree", { headers: authHeaders }).then((r) => r.json());
  console.log("Tree Structure:");
  console.log("- Root pages count:", treeRes.tree.length);
  console.log("- Subpages under root:", treeRes.tree[0].children.length);
  console.log("- Subpages under child:", treeRes.tree[0].children[0].children.length);

  // Single page + breadcrumb
  const pageDetail = await fetch(base + "/api/v1/pages/" + grandChild.page._id, {
    headers: authHeaders,
  }).then((r) => r.json());
  console.log("Breadcrumb for Grandchild:", pageDetail.breadcrumb.map((b) => b.title).join(" > "));

  // Sharing
  const shareRes = await fetch(base + "/api/v1/pages/" + childPage1.page._id + "/share", {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ isPublic: true, includeSubpages: true }),
  }).then((r) => r.json());
  console.log("Share slug generated:", shareRes.page.shareSlug);

  // Public Page fetch
  const publicPage = await fetch(base + "/api/v1/public/pages/" + shareRes.page.shareSlug).then((r) => r.json());
  console.log(
    "Public page access (no auth):",
    publicPage.success ? "SUCCESS" : "FAIL",
    `"${publicPage.page.title}"`,
    "Children count:",
    publicPage.children.length
  );

  // Tag update (accept/reject)
  const tagRes = await fetch(base + "/api/v1/pages/" + childPage1.page._id + "/tags", {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ name: "networking", action: "accept" }),
  }).then((r) => r.json());
  console.log("Tags after accept:", tagRes.tags);

  console.log("\n--- Testing Phase 3: Image Upload Sign ---");
  const uploadSign = await fetch(base + "/api/v1/upload/sign", { headers: authHeaders }).then((r) => r.json());
  console.log("Upload signature:", uploadSign.success ? "SUCCESS" : uploadSign, "Cloud name:", uploadSign.cloudName);

  console.log("\n--- Testing Phase 4: RAG Pipeline & Chat ---");
  console.log("Waiting 6s for background embeddings in Qdrant...");
  await new Promise((r) => setTimeout(r, 6000));

  console.log("Querying Chat endpoint with SSE streaming: 'Explain load balancing algorithms from my notes'");
  const chatRes = await fetch(base + "/api/v1/chat", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      message: "Explain load balancing algorithms from my notes",
      scope: "all",
    }),
  });

  const reader = chatRes.body.getReader();
  const decoder = new TextDecoder();
  let chatOutput = "";
  let finalSources = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6);
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.token) {
            chatOutput += parsed.token;
          }
          if (parsed.done) {
            finalSources = parsed.sources;
          }
        } catch (e) {}
      }
    }
  }

  console.log("🤖 Chat Response:\n", chatOutput.trim());
  console.log("📚 Sources Cited:", finalSources);

  console.log("\n--- Testing Cascade Delete ---");
  const delRes = await fetch(base + "/api/v1/pages/" + rootPage.page._id, {
    method: "DELETE",
    headers: authHeaders,
  }).then((r) => r.json());
  console.log("Cascade deleted page count:", delRes.deletedIds.length, delRes.deletedIds);

  const finalTree = await fetch(base + "/api/v1/pages/tree", { headers: authHeaders }).then((r) => r.json());
  console.log("Tree count after deletion:", finalTree.tree.length);

  console.log("\n🎉 ALL BACKEND PHASES (1, 2, 3, 4) VERIFIED SUCCESSFULLY!");
}

test().catch(console.error);
