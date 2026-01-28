document.addEventListener("DOMContentLoaded", () => {
  const timeline = document.querySelector(".timeline");
  let items = JSON.parse(localStorage.getItem("timelineData")) || [];
  let currentEditId = null;

  const saveAndRefresh = (doSort = true) => {
    if (doSort) {
      items.sort((a, b) => {
        const d1 = a.date ? new Date(a.date.replace(/-/g, "/")) : new Date(0);
        const d2 = b.date ? new Date(b.date.replace(/-/g, "/")) : new Date(0);
        return d1 - d2;
      });
    }
    localStorage.setItem("timelineData", JSON.stringify(items));
    renderTimeline();
  };

  const renderTimeline = () => {
    if (!timeline) return;
    timeline.innerHTML = "";
    items.forEach((item) => {
      const el = document.createElement("div");
      el.className = "timeline-item mb-12 relative group";
      
      if (item.type === 'milestone') {
        el.innerHTML = `
          <div class="dot top-1/2 -translate-y-1/2 bg-amber-500"></div>
          <div class="milestone-box relative mx-auto max-w-[85%] shadow-lg">
             <div class="absolute -top-3 right-0 flex gap-1 button-group">
                <button onclick="window.openEdit('${item.id}')" class="bg-slate-800 text-white px-2 py-1 rounded-full text-[10px] font-bold">EDIT</button>
                <button onclick="window.deleteItem('${item.id}')" class="bg-red-500 text-white px-2 py-1 rounded-full text-[10px] font-bold">DELETE</button>
             </div>
             <p class="text-[9px] font-bold text-amber-600 text-center uppercase">${window.formatDate(item.date)}</p>
             <p class="text-xl font-black text-slate-800 text-center leading-tight">${item.title}</p>
          </div>`;
      } else {
        el.innerHTML = `
          <div class="dot top-6 bg-indigo-600"></div>
          <div class="timeline-content ${item.position || 'left'}">
            <div class="timeline-text">
              <h3 class="text-[10px] font-bold text-indigo-600">${window.formatDate(item.date)}</h3>
              <p class="text-sm font-bold leading-tight">${item.title}</p>
            </div>
            <div class="image-wrapper shadow-md" onclick="void(0)">
              <div class="absolute top-1 right-1 flex gap-1 z-50 button-group">
                <button onclick="window.toggleSide('${item.id}')" class="bg-sky-500 text-white px-2 py-1 rounded text-[9px] font-bold">SWAP</button>
                <button onclick="window.openEdit('${item.id}')" class="bg-white text-slate-800 px-2 py-1 rounded text-[9px] font-bold border">EDIT</button>
                <button onclick="window.deleteItem('${item.id}')" class="bg-red-500 text-white px-2 py-1 rounded text-[9px] font-bold">DELETE</button>
              </div>
              ${item.image ? `<img src="${item.image}" class="w-full h-full object-cover">` : `<div class="h-full bg-slate-200 flex items-center justify-center text-[8px] text-slate-400">NO PHOTO</div>`}
            </div>
          </div>`;
      }
      timeline.appendChild(el);
    });
  };

  // --- MODAL CONTROLS ---
  window.toggleModal = (id, show) => {
    document.getElementById(id).classList.toggle("hidden", !show);
    // Reset file inputs when closing
    if(!show) {
      document.getElementById('imageInput').value = "";
      document.getElementById('edit-image-input').value = "";
    }
  };

  window.openEdit = (id) => {
    currentEditId = id;
    const item = items.find(i => i.id.toString() === id.toString());
    
    // UI Setup for Milestone vs Memory
    document.getElementById("edit-image-section").style.display = item.type === 'milestone' ? 'none' : 'block';
    document.getElementById("edit-title").value = item.title;
    document.getElementById("edit-date").value = item.date || "";
    document.getElementById("edit-note").value = item.note || "";
    
    // Preview existing image
    const preview = document.getElementById("edit-image-preview");
    preview.style.backgroundImage = item.image ? `url(${item.image})` : 'none';
    preview.innerHTML = item.image ? "" : "<span class='text-[10px] text-slate-400'>NO IMAGE</span>";

    window.toggleModal('editModal', true);
  };

  // --- BUTTON ACTIONS ---
  
  // 1. ADD NEW MEMORY
  document.getElementById("saveBtn").onclick = () => {
    const file = document.getElementById("imageInput").files[0];
    const newItem = { 
      id: Date.now().toString(), 
      title: document.getElementById("titleInput").value || "Memory", 
      date: document.getElementById("timeline-date").value, 
      note: document.getElementById("noteInput").value, 
      type: 'memory', 
      position: 'left',
      image: null 
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        newItem.image = e.target.result;
        items.push(newItem);
        saveAndRefresh();
        window.toggleModal('modal', false);
      };
      reader.readAsDataURL(file);
    } else {
      items.push(newItem);
      saveAndRefresh();
      window.toggleModal('modal', false);
    }
  };

  // 2. UPDATE EXISTING ITEM
  document.getElementById("updateBtn").onclick = () => {
    const index = items.findIndex(i => i.id.toString() === currentEditId.toString());
    if (index === -1) return;

    items[index].title = document.getElementById("edit-title").value;
    items[index].date = document.getElementById("edit-date").value;
    items[index].note = document.getElementById("edit-note").value;

    const file = document.getElementById("edit-image-input").files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        items[index].image = e.target.result; // Update image data
        saveAndRefresh();
        window.toggleModal('editModal', false);
      };
      reader.readAsDataURL(file);
    } else {
      saveAndRefresh(); // Keep existing image (or null) and update text
      window.toggleModal('editModal', false);
    }
  };

  // 3. REMOVE IMAGE ONLY
  document.getElementById("removeImageBtn").onclick = () => {
    const index = items.findIndex(i => i.id.toString() === currentEditId.toString());
    if (index !== -1 && confirm("Remove this photo?")) {
      items[index].image = null;
      document.getElementById("edit-image-preview").style.backgroundImage = "none";
      document.getElementById("edit-image-preview").innerHTML = "<span class='text-[10px] text-slate-400'>IMAGE REMOVED</span>";
      // We don't close the modal yet, let them save or edit text
    }
  };

  // --- HELPERS ---
  window.toggleSide = (id) => {
    const item = items.find(i => i.id.toString() === id.toString());
    if (item) { item.position = item.position === 'right' ? 'left' : 'right'; saveAndRefresh(false); }
  };

  window.deleteItem = (id) => {
    if (confirm("Delete this permanently?")) {
      items = items.filter(i => i.id.toString() !== id.toString());
      saveAndRefresh();
    }
  };

  window.formatDate = (iso) => {
    if (!iso) return "No Date";
    const d = new Date(iso.replace(/-/g, "/"));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  document.getElementById("milestoneOkBtn").onclick = () => {
    items.push({ id: Date.now().toString(), title: document.getElementById("milestoneTitle").value || "Milestone", type: 'milestone', date: document.getElementById("milestone-date-input").value });
    saveAndRefresh(); window.toggleModal('milestoneModal', false);
  };

  document.getElementById("deleteBtnModal").onclick = () => { window.deleteItem(currentEditId); window.toggleModal('editModal', false); };
  document.getElementById("addBtn").onclick = () => window.toggleModal('modal', true);
  document.getElementById("addMilestoneBtn").onclick = () => window.toggleModal('milestoneModal', true);

  renderTimeline();
});