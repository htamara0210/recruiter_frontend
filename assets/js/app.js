class RecruiterApp {
  constructor() {
    this.candidates = [];
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalCandidates = 0;
    this.currentFilters = {
      status: 'all',
      search: ''
    };
    this.currentCandidate = null;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadCandidates();
  }

  bindEvents() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.loadCandidates();
    });

    // Filters - ahora llaman al backend
    document.getElementById('statusFilter').addEventListener('change', (e) => {
      this.currentFilters.status = e.target.value;
      this.currentPage = 1; // Reset page
      this.loadCandidates();
    });

    document.getElementById('searchInput').addEventListener('input', 
      this.debounce((e) => {
        this.currentFilters.search = e.target.value;
        this.currentPage = 1; // Reset page
        this.loadCandidates();
      }, 500) // Aumenté el delay para menos requests
    );

    // Pagination
    document.getElementById('prevBtn').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadCandidates();
      }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
      const maxPage = Math.ceil(this.totalCandidates / this.pageSize);
      if (this.currentPage < maxPage) {
        this.currentPage++;
        this.loadCandidates();
      }
    });

    // Modal events
    document.getElementById('closeModal').addEventListener('click', () => {
      UIComponents.hideModal();
    });

    document.getElementById('candidateModal').addEventListener('click', (e) => {
      if (e.target.id === 'candidateModal') {
        UIComponents.hideModal();
      }
    });

    document.getElementById('toggleStatusBtn').addEventListener('click', () => {
      if (this.currentCandidate) {
        this.toggleCandidateReviewFromModal(this.currentCandidate.id, this.currentCandidate.is_reviewed);
      }
    });

    // Table events
    document.getElementById('tableBody').addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;

      if (button.classList.contains('view-details')) {
        const candidateId = button.dataset.id;
        this.viewCandidateDetails(candidateId);
      }
    });

    // Status pill clicks
    document.getElementById('tableBody').addEventListener('click', (e) => {
      if (e.target.closest('.status-pill')) {
        const pill = e.target.closest('.status-pill');
        const row = pill.closest('tr');
        const candidateId = row.dataset.id;
        const currentState = pill.dataset.reviewed;
        this.toggleCandidateReview(candidateId, currentState, pill);
      }
    });

    // File card clicks in modal
    document.getElementById('filesList').addEventListener('click', (e) => {
      const fileCard = e.target.closest('.file-card');
      if (fileCard) {
        this.previewFile(fileCard.dataset.url);
        
        // Update active state
        document.querySelectorAll('.file-card').forEach(card => 
          card.classList.remove('active')
        );
        fileCard.classList.add('active');
      }
    });
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async loadCandidates() {
    try {
      UIComponents.showLoading();
      
      // Enviar filtros al backend
      const response = await apiService.getCandidates({
        status: this.currentFilters.status,
        search: this.currentFilters.search,
        page: this.currentPage,
        limit: this.pageSize
      });

      // Manejar respuesta del backend
      if (response.data) {
        // Formato con paginación
        this.candidates = response.data;
        this.totalCandidates = response.total;
        this.currentPage = response.page;
      } else {
        // Formato simple (sin paginación)
        this.candidates = response;
        this.totalCandidates = response.length;
      }
      
      this.renderTable();
      UIComponents.hideLoading();
      UIComponents.showToast('Candidatos cargados correctamente');
      
    } catch (error) {
      UIComponents.hideLoading();
      UIComponents.showToast('Error al cargar candidatos', 'error');
      console.error('Error loading candidates:', error);
    }
  }

  renderTable() {
    const tbody = document.getElementById('tableBody');

    tbody.innerHTML = this.candidates.map(candidate => 
      UIComponents.createTableRow(candidate)
    ).join('');

    // Update UI elements
    UIComponents.updateRecordCount(this.candidates.length, this.totalCandidates);
    
    const maxPage = Math.ceil(this.totalCandidates / this.pageSize);
    UIComponents.updatePagination(
      this.currentPage,
      this.currentPage < maxPage,
      this.currentPage > 1
    );
  }

  async viewCandidateDetails(candidateId) {
    try {
      UIComponents.showLoading();
      const candidateData = await apiService.getCandidateDetail(candidateId);
      // La respuesta es un array, tomamos el primer elemento
      const candidate = candidateData[0];
      this.currentCandidate = candidate;
      this.renderCandidateModal(candidate);
      UIComponents.hideLoading();
      UIComponents.showModal();
    } catch (error) {
      UIComponents.hideLoading();
      UIComponents.showToast('Error al cargar detalles del candidato', 'error');
      console.error('Error loading candidate details:', error);
    }
  }

  renderCandidateModal(candidate) {
    document.getElementById('candidateName').textContent = candidate.full_name;
    document.getElementById('candidateDoc').textContent = 
      `Documento: ${candidate.id_number}`;

    const filesList = document.getElementById('filesList');
    if (candidate.files && candidate.files.length > 0) {
      filesList.innerHTML = candidate.files.map((file, index) => 
        UIComponents.createFileCard(file, index === 0)
      ).join('');

      // Load first file by default
      if (candidate.files[0]) {
        this.previewFile(candidate.files[0].s3_url);
      }
    } else {
      filesList.innerHTML = '<p>No hay documentos disponibles</p>';
    }
  }

  previewFile(fileUrl) {
    const pdfViewer = document.getElementById('pdfViewer');
    pdfViewer.src = fileUrl;
  }


  async toggleCandidateReviewFromModal(candidateId, currentState) {
    const newState = !currentState;
    const toggleBtn = document.getElementById('toggleStatusBtn');
    
    // Mostrar loading en el botón
    const originalContent = toggleBtn.innerHTML;
    toggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    toggleBtn.disabled = true;
    
    try {
      const response = await apiService.toggleCandidateReview(candidateId);
      
      if (!response.ok) {
        throw new Error('No se pudo actualizar el estado');
      }

      // Actualizar estado en el modal
      this.currentCandidate.is_reviewed = newState;
      UIComponents.updateModalStatus(newState);

      // Actualizar estado en la tabla si el candidato está visible
      const tableRow = document.querySelector(`tr[data-id="${candidateId}"]`);
      if (tableRow) {
        const statusCell = tableRow.querySelector('td:nth-child(5)');
        statusCell.innerHTML = UIComponents.createStatusPill(newState);
      }

      // Actualizar datos locales
      const candidate = this.candidates.find(c => c.id == candidateId);
      if (candidate) {
        candidate.is_reviewed = newState;
      }

      const message = newState ? 'Candidato marcado como revisado' : 'Candidato marcado como pendiente';
      UIComponents.showToast(message);
      
    } catch (error) {
      UIComponents.showToast('Error al actualizar estado', 'error');
      console.error('Error toggling review status:', error);
    } finally {
      // Restaurar botón
      toggleBtn.disabled = false;
      UIComponents.updateModalStatus(this.currentCandidate.is_reviewed);
    }
  }

  
  async toggleCandidateReview(candidateId, currentState, button) {
    const wasReviewed = JSON.parse(currentState);
    const newState = !wasReviewed;
    
    // Optimistic UI update
    button.textContent = '...';
    
    try {
      const response = await apiService.toggleCandidateReview(candidateId);
      
      if (!response.ok) {
        throw new Error('No se pudo actualizar el estado');
      }

      // Update UI
      button.outerHTML = UIComponents.createStatusPill(newState);
      
      // Update local data
      const candidate = this.candidates.find(c => c.id == candidateId);
      if (candidate) {
        candidate.is_reviewed = newState;
      }

      if (this.currentCandidate && this.currentCandidate.id == candidateId) {
        this.currentCandidate.is_reviewed = newState;
        UIComponents.updateModalStatus(newState);
      }

      const message = newState ? 'Candidato marcado como revisado' : 'Candidato marcado como pendiente';
      UIComponents.showToast(message);
      
      // Re-aplicar filtros para mantener la vista consistente
      // this.loadCandidates(); // Descomenta si quieres recargar desde el backend
      
    } catch (error) {
      UIComponents.showToast('Error al actualizar estado', 'error');
      console.error('Error toggling review status:', error);
      this.loadCandidates(); // Recargar en caso de error
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RecruiterApp();
});