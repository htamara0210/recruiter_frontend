class UIComponents {
  static showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
  }

  static hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
  }

  static showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    toast.innerHTML = `
      <i class="${icon}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static createStatusPill(isReviewed) {
    const status = isReviewed ? 'reviewed' : 'pending';
    const text = isReviewed ? 'Revisado' : 'Pendiente';
    const icon = isReviewed ? 'fas fa-check' : 'fas fa-clock';
    
    return `
      <span class="status-pill ${status}" data-reviewed="${isReviewed}">
        <i class="${icon}"></i>
        ${text}
      </span>
    `;
  }

  static createTableRow(candidate) {
    return `
      <tr data-id="${candidate.id}">
        <td>${candidate.id}</td>
        <td>${candidate.full_name}</td>
        <td>${candidate.id_number}</td>
        <td>${this.formatDate(candidate.created_at)}</td>
        <td>${this.createStatusPill(candidate.is_reviewed)}</td>
        <td>
          <button class="btn btn-primary action-btn view-details" data-id="${candidate.id}">
            <i class="fas fa-eye"></i>
            Ver detalles
          </button>
        </td>
      </tr>
    `;
  }

  static createFileCard(file, isActive = false) {
    // Extraer nombre del archivo de la URL S3
    const filename = file.s3_url.split('/').pop();
    const fileExtension = filename.split('.').pop().toLowerCase();
    let icon = 'fas fa-file';
    
    switch (fileExtension) {
      case 'pdf':
        icon = 'fas fa-file-pdf';
        break;
      case 'doc':
      case 'docx':
        icon = 'fas fa-file-word';
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
        icon = 'fas fa-file-image';
        break;
    }

    return `
      <div class="file-card ${isActive ? 'active' : ''}" data-url="${file.s3_url}">
        <div class="file-icon">
          <i class="${icon}"></i>
        </div>
        <div class="file-info">
          <h6>${filename}</h6>
          <p>${file.file_type || fileExtension.toUpperCase()}</p>
        </div>
      </div>
    `;
  }

  static showModal() {
    document.getElementById('candidateModal').classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  static hideModal() {
    document.getElementById('candidateModal').classList.remove('show');
    document.body.style.overflow = '';
    
    // Clear modal content
    document.getElementById('candidateName').textContent = '';
    document.getElementById('candidateDoc').textContent = '';
    document.getElementById('filesList').innerHTML = '';
    document.getElementById('pdfViewer').src = '';
  }

  static updateModalStatus(isReviewed) {
    const modalStatusPill = document.getElementById('modalStatusPill');
    const toggleBtn = document.getElementById('toggleStatusBtn');
    
    modalStatusPill.innerHTML = this.createStatusPill(isReviewed);
    
    // Actualizar texto del botón
    const newText = isReviewed ? 'Marcar como pendiente' : 'Marcar como revisado';
    const newIcon = isReviewed ? 'fas fa-clock' : 'fas fa-check';
    
    toggleBtn.innerHTML = `<i class="${newIcon}"></i> ${newText}`;
  }

  static updateRecordCount(current, total) {
    document.getElementById('recordCount').textContent = 
      `Mostrando ${current} de ${total} candidatos`;
  }

  static updatePagination(currentPage, hasNext, hasPrev) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    prevBtn.disabled = !hasPrev;
    nextBtn.disabled = !hasNext;
    pageInfo.textContent = `Página ${currentPage}`;
  }
}