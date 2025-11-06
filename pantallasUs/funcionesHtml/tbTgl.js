 (function(){
            function setupRowSelection(){
                const table = document.getElementById('tabla');
                if(!table) return;
                table.addEventListener('click', function(e){
                    const tr = e.target.closest('tr');
                    if(!tr) return;
                    // ignore header rows
                    if(tr.querySelector('th')) return;

                    const multi = e.ctrlKey || e.metaKey;
                    if(!multi){
                        // remove selection from others
                        const prev = table.querySelectorAll('tbody tr.selected');
                        prev.forEach(r=>{ if(r !== tr) r.classList.remove('selected'); });
                    }

                    // toggle selection on clicked row
                    tr.classList.toggle('selected');
                });
            }

            if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupRowSelection);
            else setupRowSelection();
        })();