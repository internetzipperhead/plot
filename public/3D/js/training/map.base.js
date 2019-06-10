/**
 * 图像显需要用到的基础显示类
 * 1、右边菜单栏
 * 2、可后台分页查看，默认每页的页容是 50
 */
class MapMenu {
  constructor (options={}) {
    this.version = '1.0'
    this.options = {
      url: 'v1/api/upload'
    }
    Object.assign(this.options, options)
    this.options.img_sql.page = this.options.img_sql.page ? Number(this.options.img_sql.page) : 1
    this.init()
  }
  init () {
    this.activeIndex = 0
    this.activeID = null
    this.pagesCount = Math.ceil(this.options.img_sql.count / 50)
    this.page = this.options.img_sql.page
    this.imgData = null
    this.imgListHtml = {}
    this.initElement()
    this.attachEvent()
    this.fetchImgData()
  }
  fetchImgData () {
    let that = this
    $.NstsGET(APIURI + this.options.url, this.options.img_sql, function (data) {
        that.imgData = data.data.images
        that.imgCount = data.data.images.length
        that.pagesCount = that.pagesCount || Math.ceil(that.imgCount / 50)
        that.generateImgList(data.data.images)
        that.renderImgList()
        that.bindDeleteEvent()
        that.initShow()
    },{
        traditional: true
    })
  }
  generateImgList (data) {
    let mapListHtml = ''
    data.forEach(item => {
    mapListHtml += `
        <li data-id="${item.id}" data-isdanger="${item.isTip ? true : false}" class="${item.id === this.activeID ? 'active' : ''}">
          <div class="thumbnail">
            <img src="${item.thumbnails.length > 0 && item.thumbnails[0].url ? item.thumbnails[0].url : item.dr[0].url || './images/common-icons/no-img.png'}" />
            <i class="delete-image j-delete-plot-image" title="删除图像" data-deleteid="${item.id}"></i>
          </div>
          <div class="byname" title="${item.name}">${item.name}</div>
        </li>
    `
    })
    this.imgListHtml[`page-${this.page}`] || (this.imgListHtml[`page-${this.page}`] = mapListHtml)
  }
  renderImgList () {
    this.mapContent.html(this.imgListHtml[`page-${this.page}`])
    this.checkPages()
  }
  initElement (data) {
    this.mapOuter = $('.j-map-menu')
    this.fixTitle = $(`<div class="fix-title animated">${lang.imageMap}</div>`)
    let title = `<header class="map-title"><h3><i class="nucfont inuc-menu j-map-mini"></i></h3><i class="nucfont inuc-arrow-right j-map-hide"></i></header>`
    let mapUl = `<ul class="map-content"></ul>`
    let pagesControl = `<div class="pages">
      <a class="j-prev">${lang.prev}</a><a class="j-next">${lang.next}</a>
      <i class="nucfont inuc-prev j-prev disabled"></i><i class="nucfont inuc-next j-next"></i>
    </div>`
    $('body').append(this.fixTitle)
    this.mapOuter.append(title)
    this.mapOuter.append(mapUl)
    this.mapOuter.append(pagesControl)
    this.prevPage = this.mapOuter.find('.j-prev')
    this.nextPage = this.mapOuter.find('.j-next')
    this.mapContent = this.mapOuter.find('.map-content')
    this.mapContentH = this.mapContent.height()
  }
  checkPages () {
    this.prevPage.removeClass('disabled')
    this.nextPage.removeClass('disabled')
    if (this.page === 1) {
        this.prevPage.addClass('disabled')
    }
    if (this.page === this.pagesCount) {
        this.nextPage.addClass('disabled')
    }
  }
  initShow () {
    if (this.activeID) {
      this.mapOuter.find(`li[data-id="${this.activeID}"]`).click()
      return
    }
    if (this.options.initShowId) {
        this.mapOuter.find(`li[data-id="${this.options.initShowId}"]`).click()
        this.options.initShowId = null
    } else {
      this.mapOuter.find('li').eq(0).click()
    }
  }
  bindDeleteEvent () {
    let that = this
    // 删除图像
    $('.j-delete-plot-image').click(function() {
      let id = $(this).data('deleteid')
      let $parent = $(this).parent('li')
      let index = $parent.index()
      if (index === 0) {
        that.activeID = $parent.prev().data('id')
      } else {
        that.activeID = $parent.next().data('id')
      }
      NSTS.Plugin.Alert.Confirm('确定删除该图像吗？', () => {
        $.NstsDEL(APIURI + 'api/plot/' + id, res => {
          if (!res.result) {
            NSTS.Plugin.Alert.Error(res.msg)
          }
          that.fetchImgData()
        })
      })
    })
  }
  attachEvent () {
    let that = this
    this.mapOuter.on('click', '.j-map-mini', _ => {
        this.mapOuter.toggleClass('mini')
    })
    this.mapOuter.on('click', '.j-map-hide', function() {
      that.mapOuter.removeClass('fadeInRight').addClass('animated fadeOutRight')
      that.fixTitle.removeClass('fadeOutUp').addClass('fadeInRight')
    })

    this.fixTitle.click(function() {
      that.mapOuter.removeClass('fadeOutRight').addClass('fadeInRight')
      $(this).removeClass('fadeInRight').addClass('fadeOutUp')
    })
    // 点击图像菜单
    this.mapOuter.on('click', 'li', function() {
      let index = $(this).index()
      if (!$(this).hasClass('active') && that.options.imgInstance.Viewer.hasLoaded) {
        $(this).addClass('active').siblings().removeClass('active')
        that.shiftPosition()
        that.options.imgInstance.updateImgSuspect()
        that.activeIndex = index
        that.options.imgInstance.initShow(that.imgData[index])
      }
    })
    // 点击上下页
    this.prevPage.on('click', function() {
      if ($(this).hasClass('disabled')) {
          return false
      }
      that.page -= 1
      if (that.imgListHtml[`page-${this.page}`]) {
          that.renderImgList(that.imgListHtml[`page-${that.page}`])
          that.initShow()
      } else {
          that.options.img_sql.page -= 1
          that.fetchImgData()
      }
    })
    this.nextPage.on('click', function() {
      if ($(this).hasClass('disabled')) {
          return false
      }
      that.page += 1
      if (that.imgListHtml[`page-${this.page}`]) {
          that.renderImgList(that.imgListHtml[`page-${that.page}`])
          that.initShow()
      } else {
          that.options.img_sql.page += 1
          that.fetchImgData()
      }
    })
  }
  prevImgShow () {
    this.options.imgInstance.updateImgSuspect()
    this.activeIndex = Math.max(0, --this.activeIndex)
    this.mapOuter.find(`li:eq(${this.activeIndex})`).addClass('active').siblings().removeClass('active')
    this.shiftPosition(-1)
    this.options.imgInstance.showDR(this.imgData[this.activeIndex])
  }
  nextImgShow () {
    this.options.imgInstance.updateImgSuspect()
    this.activeIndex = Math.min(this.imgCount, ++this.activeIndex)
    this.mapOuter.find(`li:eq(${this.activeIndex})`).addClass('active').siblings().removeClass('active')
    this.shiftPosition(1)
    this.options.imgInstance.showDR(this.imgData[this.activeIndex])
  }
  activeRenderData () {
    return this.imgData[this.activeIndex]
  }
  shiftPosition(type = 1) {
    let activeItem = this.mapOuter.find('li.active')
    let index = activeItem.index()
    if (index === 0) {
      this.mapContent.scrollTop(0)
      return
    }
    let activeHeight = activeItem.position().top
    let scrollTop = this.mapContent.scrollTop()
    if (scrollTop === 0 && activeHeight > 600) {
      scrollTop = activeHeight - 300
      this.mapContent.scrollTop(scrollTop)
    } else {
      if (activeHeight > this.mapContentH) {
        scrollTop = scrollTop + 40 * index * type - 600
        this.mapContent.scrollTop(scrollTop)
      }
      if (activeHeight < 40) {
        scrollTop = scrollTop - 300
        this.mapContent.scrollTop(scrollTop)
      }
    }
  }
}

// 获取url的参数
function getUrlParams() {
    let search = location.search
    let params = null
    if (search) {
        params = {}
        search.slice(1).split('&').forEach(item => {
            let arr = item.split('=')
            params[arr[0]] = decodeURI(arr[1]) // 处理中文乱码问题
        })
    }
    return params
}

// 时间转换
function formatSeconds (time) {
    let minutes = Math.floor(time / 60)
    let seconds = time % 60
    if (minutes > 0) {
        return `${minutes}${minutes > 1 ? lang.minutes : lang.minute}${seconds} ${seconds > 1 ? lang.seconds : lang.second}`
    } else {
        return `${seconds}${seconds > 1 ? lang.seconds : lang.second}`
    }
}
// 时间转换（没有单位）
function formatSecondsNoUnit (time) {
    let hours = Math.floor(time / 3600)
    let minutes = Math.floor((time - 3600 * hours) / 60)
    minutes = minutes > 9 ? minutes : '0' + minutes
    let seconds = time % 60
    seconds = seconds > 9 ? seconds : '0' + seconds
    if (hours > 1) {
        return `${hours}:${minutes}:${seconds}`
    } else {
        return `${minutes}:${seconds}`
    }
}

// 获取用户信息
function getUserInfo(key) {
    let cookie = decodeURIComponent(document.cookie)
    try {
        let userInfo = JSON.parse(cookie.match(/userInfo=({.*})/g)[0].slice(9))
        return userInfo[key]
    } catch (error) {
        return ''
    }
}

