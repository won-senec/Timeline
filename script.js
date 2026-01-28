document.addEventListener("DOMContentLoaded", () => {
  const timeline = document.querySelector(".timeline");
  let items = JSON.parse(localStorage.getItem("timelineData")) || [];
  let currentEditId = null;
  let activeMoveIndex = null;

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

  const createDropZone = (idx) => {
    const d = document.createElement("div"); 
    d.className = "drop-zone";
    d.innerHTML = "<span class='text-[10px] font-bold text-indigo-500 uppercase'>Drop Here</span>";
    d.onclick = () => {
      const movedItem = items.splice(activeMoveIndex, 1)[0];
      items.splice(idx > activeMoveIndex ? idx - 1 : idx, 0, movedItem);
      activeMoveIndex = null;
      saveAndRefresh(false);
    };
    return d;
  };

  const renderTimeline = () => {
    if (!timeline) return;
    timeline.innerHTML = "";
    items.forEach((item, index) => {
      if (activeMoveIndex !== null && index === 0) timeline.appendChild(createDropZone(0));
      
      const el = document.createElement("div");
      el.className = `timeline-item mb-12 relative group ${activeMoveIndex === index ? 'opacity-30' : ''}`;
      
      if (item.type === 'milestone') {
        el.innerHTML = `
          <div class="dot top-1/2 -translate-y-1/2 bg-amber-500 z-10"></div>
          <div class="milestone-box relative mx-auto max-w-[80%] shadow-lg z-20">
             <div class="absolute -top-6 right-0 flex gap-1 z-[60] button-group">
                <button onclick="window.toggleReorderMode(${index})" class="bg-indigo-600 text-white px-2 py-1 rounded-full text-[8px] font-bold shadow-lg">MOVE</button>
                <button onclick="window.openEdit('${item.id}')" class="bg-slate-800 text-white px-2 py-1 rounded-full text-[8px] font-bold shadow-lg">EDIT</button>
                <button onclick="window.deleteItem('${item.id}')" class="bg-red-500 text-white px-2 py-1 rounded-full text-[8px] font-bold shadow-lg">DELETE</button>
             </div>
             <p class="text-[9px] font-bold text-amber-600 text-center uppercase mb-1">${window.formatDate(item.date)}</p>
             <p class="text-base font-black text-slate-800 text-center px-2 leading-tight">${item.title}</p>
          </div>`;
      } else {
        el.innerHTML = `
          <div class="dot top-6 bg-indigo-600 z-10"></div>
          <div class="timeline-content ${item.position || 'left'} z-20">
            <div class="timeline-text px-2">
              <h3 class="text-[9px] font-bold text-indigo-600 uppercase">${window.formatDate(item.date)}</h3>
              <p class="text-[11px] font-bold leading-tight">${item.title}</p>
            </div>
            <div class="image-wrapper relative bg-white rounded-xl shadow-md overflow-hidden">
              <div class="absolute top-1 right-1 flex gap-1 z-[60] button-group">
                <button onclick="window.toggleReorderMode(${index})" class="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[7px] font-bold">MOVE</button>
                <button onclick="window.toggleSide('${item.id}')" class="bg-sky-500 text-white px-1.5 py-0.5 rounded text-[7px] font-bold">SWAP</button>
                <button onclick="window.openEdit('${item.id}')" class="bg-white text-indigo-700 px-1.5 py-0.5 rounded text-[7px] font-bold border">EDIT</button>
                <button onclick="window.deleteItem('${item.id}')" class="bg-red-500 text-white px-1.5 py-0.5 rounded text-[7px] font-bold">DELETE</button>
              </div>
              ${item.image ? `<img src="${item.image}" class="w-full h-full object-cover">` : `<div class="h-full bg-slate-100 flex items-center justify-center text-[7px] font-bold text-slate-300 uppercase">No Photo</div>`}
            </div>
          </div>`;
      }
      timeline.appendChild(el);
      if (activeMoveIndex !== null) timeline.appendChild(createDropZone(index + 1));
    });
  };

  window.toggleReorderMode = (idx) => {
    activeMoveIndex = (activeMoveIndex === idx) ? null : idx;
    renderTimeline();
  };

  window.toggleModal = (id, show) => {
    document.getElementById(id).classList.toggle("hidden", !show);
  };

  window.openEdit = (id) => {
    currentEditId = id.toString();
    const item = items.find(i => i.id.toString() === currentEditId);
    document.getElementById("edit-image-section").style.display = item.type === 'milestone' ? 'none' : 'block';
    document.getElementById("edit-title").value = item.title;
    document.getElementById("edit-date").value = item.date || "";
    document.getElementById("edit-note").value = item.note || "";
    const preview = document.getElementById("edit-image-preview");
    preview.style.backgroundImage = item.image ? `url(${item.image})` : 'none';
    preview.innerHTML = item.image ? "" : "NO PHOTO";
    window.toggleModal('editModal', true);
  };

  document.getElementById("updateBtn").onclick = () => {
    const item = items.find(i => i.id.toString() === currentEditId);
    item.title = document.getElementById("edit-title").value;
    item.date = document.getElementById("edit-date").value;
    item.note = document.getElementById("edit-note").value;
    const file = document.getElementById("edit-image-input").files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { item.image = e.target.result; saveAndRefresh(); window.toggleModal('editModal', false); };
      reader.readAsDataURL(file);
    } else { saveAndRefresh(); window.toggleModal('editModal', false); }
  };

  document.getElementById("removeImageBtn").onclick = () => {
    const item = items.find(i => i.id.toString() === currentEditId);
    if (item && confirm("Remove photo?")) {
      item.image = null;
      document.getElementById("edit-image-preview").style.backgroundImage = 'none';
      document.getElementById("edit-image-preview").innerHTML = "REMOVED";
    }
  };

  window.toggleSide = (id) => {
    const item = items.find(i => i.id.toString() === id.toString());
    if (item) { item.position = item.position === 'right' ? 'left' : 'right'; saveAndRefresh(false); }
  };

  window.deleteItem = (id) => {
    if (confirm("Delete permanently?")) {
      items = items.filter(i => i.id.toString() !== id.toString());
      saveAndRefresh();
    }
  };

  window.formatDate = (iso) => {
    if (!iso) return "No Date";
    const d = new Date(iso.replace(/-/g, "/"));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  document.getElementById("saveBtn").onclick = () => {
    const file = document.getElementById("imageInput").files[0];
    const newItem = { id: Date.now().toString(), title: document.getElementById("titleInput").value || "Memory", date: document.getElementById("timeline-date").value, note: document.getElementById("noteInput").value, type: 'memory', position: 'left' };
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { newItem.image = e.target.result; items.push(newItem); saveAndRefresh(); window.toggleModal('modal', false); };
      reader.readAsDataURL(file);
    } else { items.push(newItem); saveAndRefresh(); window.toggleModal('modal', false); }
  };

  document.getElementById("milestoneOkBtn").onclick = () => {
    items.push({ id: Date.now().toString(), title: document.getElementById("milestoneTitle").value || "Milestone", type: 'milestone', date: document.getElementById("milestone-date-input").value });
    saveAndRefresh(); window.toggleModal('milestoneModal', false);
  };

  document.getElementById("addBtn").onclick = () => window.toggleModal('modal', true);
  document.getElementById("addMilestoneBtn").onclick = () => window.toggleModal('milestoneModal', true);
  document.getElementById("deleteBtnModal").onclick = () => { window.deleteItem(currentEditId); window.toggleModal('editModal', false); };

  renderTimeline();
});