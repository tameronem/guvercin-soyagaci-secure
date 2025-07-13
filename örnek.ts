// Bu fonksiyonu ve bir sonrakini index.tsx içine kopyalayıp mevcut olanlarla değiştirin.

const positionNodes = () => {
    const wrapper = document.querySelector('.pedigree-wrapper') as HTMLElement;
    if (!wrapper) return;

    const nodesByGen: { [key: number]: HTMLElement[] } = {};
    wrapper.querySelectorAll<HTMLElement>('.pedigree-node').forEach(node => {
        const gen = parseInt(node.dataset.gen || '1', 10);
        if (!nodesByGen[gen]) nodesByGen[gen] = [];
        nodesByGen[gen].push(node);
    });

    const wrapperHeight = wrapper.clientHeight;

    Object.keys(nodesByGen).forEach(genKey => {
        const gen = parseInt(genKey, 10);
        const nodesInThisGen = nodesByGen[gen];
        const numNodesInGen = nodesInThisGen.length;

        // X pozisyonu nesle göre belirlenir. Nesil 1 en solda.
        const x = (gen * 190) - 90;

        nodesInThisGen.forEach((node, i) => {
            // Y pozisyonu, düğümleri kendi sütunlarında dikey olarak eşit şekilde dağıtır.
            const y = (wrapperHeight / (numNodesInGen + 1)) * (i + 1);
            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
        });
    });
};

const drawConnectionLines = () => {
    const svg = document.querySelector('.connection-svg') as SVGElement;
    if (!svg) return;
    svg.innerHTML = ''; // Önceki tüm çizgileri temizle

    const containerRect = svg.getBoundingClientRect();

    document.querySelectorAll<HTMLElement>('.pedigree-node').forEach(childNodeEl => {
        const childPigeon = getPigeonById(childNodeEl.dataset.id || '');
        if (!childPigeon || !childPigeon.fatherId || !childPigeon.motherId) return;

        const fatherNodeEl = document.getElementById(`node-${childPigeon.fatherId}`) as HTMLElement;
        const motherNodeEl = document.getElementById(`node-${childPigeon.motherId}`) as HTMLElement;

        if (fatherNodeEl && motherNodeEl) {
            const childRect = childNodeEl.getBoundingClientRect();
            const fatherRect = fatherNodeEl.getBoundingClientRect();
            const motherRect = motherNodeEl.getBoundingClientRect();

            const getRelativePos = (rect: DOMRect) => ({
                left: rect.left - containerRect.left,
                right: rect.right - containerRect.left,
                top: rect.top - containerRect.top,
                centerY: rect.top + rect.height / 2 - containerRect.top,
            });

            const relChild = getRelativePos(childRect);
            const relFather = getRelativePos(fatherRect);
            const relMother = getRelativePos(motherRect);
            
            // --- 1. Ebeveynleri birleştiren "Evlilik Dirseği" ---
            const bracketX = relFather.left - 20; // Dikey birleştirme hattının X konumu

            // A. Babadan dirseğe yatay hat
            const pathFather = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathFather.setAttribute('d', `M ${relFather.left} ${relFather.centerY} H ${bracketX}`);
            pathFather.setAttribute('class', 'connection-line');
            svg.appendChild(pathFather);
            
            // B. Anneden dirseğe yatay hat
            const pathMother = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathMother.setAttribute('d', `M ${relMother.left} ${relMother.centerY} H ${bracketX}`);
            pathMother.setAttribute('class', 'connection-line');
            svg.appendChild(pathMother);
            
            // C. Bu iki hattı birleştiren dikey hat
            const pathVerticalBracket = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathVerticalBracket.setAttribute('d', `M ${bracketX} ${relFather.centerY} V ${relMother.centerY}`);
            pathVerticalBracket.setAttribute('class', 'connection-line');
            svg.appendChild(pathVerticalBracket);

            // --- 2. Çocuğu bu dirseğe bağlayan ana hat ---
            const bracketMidY = (relFather.centerY + relMother.centerY) / 2;
            const elbowX = relChild.right + 20; // Çizginin ilk dönüş yapacağı "dirsek" X konumu

            const pathMain = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            // Çocuktan başla -> Yatay sağa git -> Dikey olarak dirsek hizasına gel -> Yatay olarak dirseğe bağlan
            pathMain.setAttribute('d', `M ${relChild.right} ${relChild.centerY} H ${elbowX} V ${bracketMidY} H ${bracketX}`);
            pathMain.setAttribute('class', 'connection-line');
            svg.appendChild(pathMain);
        }
    });
};