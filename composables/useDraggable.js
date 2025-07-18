// composables/useDraggable.js
import {onBeforeUnmount} from 'vue'

export function useDraggable(targetRef) {
    let isDragging = false
    let offsetX = 0
    let offsetY = 0

    function startDrag(e) {
        if (!targetRef.value) return
        isDragging = true
        offsetX = e.clientX - targetRef.value.offsetLeft
        offsetY = e.clientY - targetRef.value.offsetTop
        document.addEventListener('mousemove', onDrag)
        document.addEventListener('mouseup', stopDrag)
    }

    function onDrag(e) {
        if (!isDragging || !targetRef.value) return
        targetRef.value.style.left = `${e.clientX - offsetX}px`
        targetRef.value.style.top = `${e.clientY - offsetY}px`
    }

    function stopDrag() {
        isDragging = false
        document.removeEventListener('mousemove', onDrag)
        document.removeEventListener('mouseup', stopDrag)
    }

    onBeforeUnmount(() => {
        stopDrag()
    })

    return {startDrag}
}

// js
// const targetRef = ref(null)
// const {startDrag} = useDraggable(targetRef)
// html
// < div
// ref = "targetRef"
// @mousedown
// = "startDrag" >
// ... </div>