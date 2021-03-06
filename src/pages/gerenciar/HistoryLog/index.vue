<template>
  <div class="main-component row">
    <portal to="page-header">
      <BaseButton template="filtros" @click="toggleAsideModal('filtros')" />
      <BaseButton template="ajuda" @click="toggleAsideModal('ajuda')" />
    </portal>

    <div class="div-table">
      <BaseTable>
        <template #thead>
          <v-th width="110">Tabela Modificada</v-th>
          <v-th width="120">Campo Modificado</v-th>
          <v-th width="200">Linha Modificada</v-th>
          <v-th width="120">Valor Anterior</v-th>
          <v-th width="120">Novo Valor</v-th>
          <v-th width="65">Operação</v-th>
          <v-th width="80" title="Usuário que realizou a operação">Usuário</v-th>
          <v-th width="160">Data</v-th>
        </template>
        <template #tbody>
          <tr v-for="history in HistoryOrdered" :key="history.id">
            <v-td width="110">{{ history.tabelaModificada }}</v-td>
            <v-td width="120" paddingX="0">
              {{ history.campoModificado }}
            </v-td>
            <v-td width="200" paddingX="0">
              {{ getLinhaModificada(history) }}
            </v-td>
            <v-td width="120" paddingX="0">
              {{ getValorAnterior(history) }}
            </v-td>
            <v-td width="120" paddingX="0">
              {{ getValorNovo(history) }}
            </v-td>
            <v-td width="65" paddingX="0">
              {{ history.tipoOperacao }}
            </v-td>
            <v-td width="80" paddingX="0">
              {{ history.usuario }}
            </v-td>
            <v-td width="160" paddingX="0">
              {{ parseDateUTC(history.createdAt) }}
            </v-td>
          </tr>

          <tr v-if="!HistoryOrdered.length">
            <v-td width="975" colspan="8">
              <b>Nenhuma operação encontrada.</b>
              Clique no botão de filtros
              <font-awesome-icon :icon="['fas', 'list-ul']" class="icon-gray" />
              para selecioná-las.
            </v-td>
          </tr>
        </template>
      </BaseTable>
    </div>

    <ModalFiltros
      ref="modalFiltros"
      :callbacks="modalFiltrosCallbacks"
      :tabsOptions="modalFiltrosTabs"
    >
      <BaseTable type="modal" v-show="modalFiltrosTabs.current === 'Tabelas'">
        <template #thead>
          <v-th width="25" />
          <v-th width="425" align="start">Nome</v-th>
        </template>

        <template #tbody>
          <tr
            v-for="tabela in TabelasOptions"
            :key="tabela.id + tabela.nome"
            @click="toggleItemInArray(tabela, filtroTabelas.selecionados)"
            v-prevent-click-selection
          >
            <v-td width="25" type="content">
              <input type="checkbox" v-model="filtroTabelas.selecionados" :value="tabela" />
            </v-td>
            <v-td width="425" align="start">{{ tabela.nome }}</v-td>
          </tr>
        </template>
      </BaseTable>
      <BaseTable type="modal" v-show="modalFiltrosTabs.current === 'Operações'">
        <template #thead>
          <v-th width="25" />
          <v-th width="425" align="start">Tipo</v-th>
        </template>

        <template #tbody>
          <tr
            v-for="operacao in OperacoesOptions"
            :key="operacao.id + operacao.nome"
            @click="toggleItemInArray(operacao, filtroOperacoes.selecionados)"
            v-prevent-click-selection
          >
            <v-td width="25" type="content">
              <input type="checkbox" v-model="filtroOperacoes.selecionados" :value="operacao" />
            </v-td>
            <v-td width="425" align="start">{{ operacao.nome }}</v-td>
          </tr>
        </template>
      </BaseTable>
    </ModalFiltros>

    <ModalAjuda ref="modalAjuda">
      <li class="list-group-item">
        <b>Visualizar conteúdo:</b>
        Clique no ícone de filtros
        <font-awesome-icon :icon="['fas', 'list-ul']" class="icon-gray" />
        no cabeçalho da página e, na janela que se abrirá, utilize as abas para navegar entre os
        tipos de filtro disponíveis. Marque quais informações deseja visualizar, e para finalizar
        clique no botão OK.
      </li>
    </ModalAjuda>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { some, find, orderBy } from "lodash-es";
import { toggleItemInArray, toggleAsideModal, preventClickSelection } from "@mixins";
import { parseDateUTC } from "@/common/utils";
import { ModalFiltros, ModalAjuda } from "@/components/modals";

export default {
  name: "DashboardHistory",
  components: { ModalFiltros, ModalAjuda },
  mixins: [toggleItemInArray, toggleAsideModal, preventClickSelection],
  data() {
    return {
      asideModalsRefs: ["modalFiltros", "modalAjuda"],
      filtroOperacoes: {
        ativados: [],
        selecionados: [],
      },
      filtroTabelas: {
        ativados: [],
        selecionados: [],
      },
      modalFiltrosTabs: {
        current: "Tabelas",
        array: ["Tabelas", "Operações"],
      },
      modalFiltrosCallbacks: {
        selectNone: {
          Tabelas: () => {
            this.filtroTabelas.selecionados = [];
          },
          Operacoes: () => {
            this.filtroOperacoes.selecionados = [];
          },
        },
        selectAll: {
          Tabelas: () => {
            this.filtroTabelas.selecionados = [...this.TabelasOptions];
          },
          Operacoes: () => {
            this.filtroOperacoes.selecionados = [...this.OperacoesOptions];
          },
        },
        btnOk: () => {
          this.filtroTabelas.ativados = [...this.filtroTabelas.selecionados];
          this.filtroOperacoes.ativados = [...this.filtroOperacoes.selecionados];
        },
      },
    };
  },

  beforeMount() {
    this.fetchAllHistory();
    this.modalFiltrosCallbacks.selectAll.Operacoes();
  },
  beforeDestroy() {
    this.clearHistoryState();
  },

  methods: {
    ...mapActions(["fetchAllHistory", "clearHistoryState"]),
    parseDateUTC,

    getLinhaModificada(h) {
      let linha = h.linhaModificada;
      let aux = undefined;
      switch (h.tabelaModificada) {
      case "CargaPos": {
        if (h.tipoOperacao === "Delete") {
          aux = linha.split("/");
          let docente = find(this.$store.state.docente.Docentes, {
            id: parseInt(aux[2]),
          });
          if (docente === undefined) {
            linha = `${aux[0]}/${aux[1]}/${aux[2]}`;
          } else {
            linha = `${aux[0]}/${aux[1]}/${docente.apelido}`;
          }
        }
        break;
      }
      case "DisciplinaGrade": {
        aux = linha.split("/");
        let disciplina = find(this.$store.state.disciplina.Disciplinas, {
          id: parseInt(aux[1]),
        });
        let grade = find(this.$store.state.grade.Grades, {
          id: parseInt(aux[2]),
        });
        let curso =
            grade === undefined
              ? undefined
              : find(this.$store.state.curso.Cursos, {
                id: grade.Curso,
              });
        linha = `${
          grade === undefined
            ? aux[2]
            : (curso === undefined ? "Curso Excluído" : curso.codigo) + " - " + grade.nome
        }/${disciplina === undefined ? aux[1] : disciplina.codigo}/${aux[0]}`;
        break;
      }

      case "DocentePerfil": {
        aux = linha.split("/");
        let docente = find(this.$store.state.docente.Docentes, {
          id: parseInt(aux[1]),
        });
        let perfil = find(this.$store.state.perfil.Perfis, {
          id: parseInt(aux[0]),
        });
        linha = `${docente === undefined ? aux[1] : docente.nome}/${
          perfil === undefined ? aux[0] : perfil.nome
        }`;
        break;
      }

      case "Grade": {
        aux = linha.split("/");
        let cursoGrade = find(this.$store.state.curso.Cursos, {
          id: parseInt(aux[0]),
        });
        linha = `${cursoGrade === undefined ? aux[0] : cursoGrade.codigo} - ${aux[1]}`;
        break;
      }

      case "Pedido": {
        aux = linha.split("/");
        let turma = find(this.$store.state.turma.Turmas, {
          id: parseInt(aux[0]),
        });
        let disciplinaPedido =
            turma === undefined
              ? undefined
              : find(this.$store.state.disciplina.Disciplinas, {
                id: turma.Disciplina,
              });
        let cursoPedido = find(this.$store.state.curso.Cursos, {
          id: parseInt(aux[1]),
        });
        linha = `${
          turma === undefined
            ? aux[0]
            : turma.Disciplina === null
              ? "Turma Excluída"
              : disciplinaPedido.codigo + " " + turma.letra
        }/${cursoPedido === undefined ? aux[1] : cursoPedido.codigo}`;
        break;
      }

      case "PedidoExterno": {
        aux = linha.split("/");
        let turmaExterna = find(this.$store.state.turmaExterna.Turmas, {
          id: parseInt(aux[0]),
        });
        let disciplinaPedidoExterno =
            turmaExterna === undefined
              ? undefined
              : find(this.$store.state.disciplina.Disciplinas, {
                id: turmaExterna.Disciplina,
              });
        let cursoPedidoExterno = find(this.$store.state.curso.Cursos, {
          id: parseInt(aux[1]),
        });
        linha = `${
          turmaExterna === undefined
            ? aux[0]
            : disciplinaPedidoExterno.codigo + " " + turmaExterna.letra
        }/${cursoPedidoExterno === undefined ? aux[1] : cursoPedidoExterno.codigo}`;
        break;
      }

      case "Turma": {
        aux = linha.split("/");
        let disciplinaTurma = find(this.$store.state.disciplina.Disciplinas, {
          id: parseInt(aux[1]),
        });
        linha = `${disciplinaTurma === undefined ? aux[1] : disciplinaTurma.codigo}/${aux[0]}`;
        break;
      }

      case "TurmaExterna": {
        aux = linha.split("/");
        let disciplinaTurmaExterna = find(this.$store.state.disciplina.Disciplinas, {
          id: parseInt(aux[1]),
        });
        linha = `${
          disciplinaTurmaExterna === undefined ? aux[1] : disciplinaTurmaExterna.codigo
        }/${aux[0]}`;
        break;
      }
      }
      return linha;
    },
    getValorAnterior(h) {
      let v = h.valorAnterior;
      switch (h.campoModificado) {
      case "Curso":
        v = find(this.$store.state.curso.Cursos, {
          id: parseInt(h.valorAnterior),
        });
        if (v === undefined) v = h.valorAnterior;
        else v = v.codigo;
        break;

      case "Disciplina":
        v = find(this.$store.state.disciplina.Disciplinas, {
          id: parseInt(h.valorAnterior),
        });
        if (v === undefined) v = h.valorAnterior;
        else v = v.codigo;
        break;

      case "Docente":
      case "Docente1":
      case "Docente2":
        v = find(this.$store.state.docente.Docentes, {
          id: parseInt(h.valorAnterior),
        });
        if (v === undefined) v = h.valorAnterior;
        else v = v.apelido;
        break;

      case "Grade":
        v = find(this.$store.state.grade.Grades, {
          id: parseInt(h.valorAnterior),
        });
        if (v === undefined) v = h.valorAnterior;
        else {
          let c = find(this.$store.state.curso.Cursos, {
            id: parseInt(v.Curso),
          });
          v = `${c === undefined ? v.Curso : c.codigo}/${v.nome}`;
        }
        break;

      case "Horario":
      case "Horario1":
      case "Horario2":
        v = find(this.$store.state.horario.Horarios, {
          id: parseInt(h.valorAnterior),
        });
        if (v === undefined) v = h.valorAnterior;
        else v = v.horario;
        break;

      case "Perfil":
        v = find(this.$store.state.perfil.Perfis, {
          id: parseInt(h.valorAnterior),
        });
        if (v === undefined) v = h.valorAnterior;
        else v = v.nome;
        break;

      case "Sala":
      case "Sala1":
      case "Sala2":
        v = find(this.$store.state.sala.Salas, {
          id: parseInt(h.valorAnterior),
        });
        if (v === undefined) v = h.valorAnterior;
        else v = v.nome;
        break;
      }

      return v;
    },
    getValorNovo(h) {
      let v = h.valorNovo;
      switch (h.campoModificado) {
      case "Curso":
        v = find(this.$store.state.curso.Cursos, {
          id: parseInt(h.valorNovo),
        });
        if (v === undefined) v = h.valorNovo;
        else v = v.codigo;
        break;

      case "Disciplina":
        v = find(this.$store.state.disciplina.Disciplinas, {
          id: parseInt(h.valorNovo),
        });
        if (v === undefined) v = h.valorNovo;
        else v = v.codigo;
        break;

      case "Docente":
      case "Docente1":
      case "Docente2":
        v = find(this.$store.state.docente.Docentes, {
          id: parseInt(h.valorNovo),
        });
        if (v === undefined) v = h.valorNovo;
        else v = v.apelido;
        break;

      case "Grade":
        v = find(this.$store.state.grade.Grades, {
          id: parseInt(h.valorNovo),
        });
        if (v === undefined) v = h.valorNovo;
        else {
          let c = find(this.$store.state.curso.Cursos, {
            id: parseInt(v.Curso),
          });
          v = `${c === undefined ? v.Curso : c.codigo}/${v.nome}`;
        }
        break;

      case "Horario":
      case "Horario1":
      case "Horario2":
        v = find(this.$store.state.horario.Horarios, {
          id: parseInt(h.valorNovo),
        });
        if (v === undefined) v = h.valorNovo;
        else v = v.horario;
        break;

      case "Perfil":
        v = find(this.$store.state.perfil.Perfis, {
          id: parseInt(h.valorNovo),
        });
        if (v === undefined) v = h.valorNovo;
        else v = v.nome;
        break;

      case "Sala":
      case "Sala1":
      case "Sala2":
        v = find(this.$store.state.sala.Salas, {
          id: parseInt(h.valorNovo),
        });
        if (v === undefined) v = h.valorNovo;
        else v = v.nome;
        break;
      }

      return v;
    },
  },

  computed: {
    ...mapGetters(["onLoading", "History"]),

    HistoryOrdered() {
      return orderBy(this.HistoryFiltered, "id", "desc");
    },
    HistoryFiltered() {
      const filterByOperacao = (history) => {
        return some(this.filtroOperacoes.ativados, ["id", history.tipoOperacao]);
      };
      const filterByOTabela = (history) => {
        return some(this.filtroTabelas.ativados, ["id", history.tabelaModificada]);
      };

      return this.History.filter(filterByOTabela).filter(filterByOperacao);
    },
    OperacoesOptions() {
      return [
        { nome: "Criação", id: "Create" },
        { nome: "Exclusão", id: "Delete" },
        { nome: "Edição", id: "Edit" },
      ];
    },
    TabelasOptions() {
      return [
        { nome: "CARGA PÓS", id: "CargaPos" },
        { nome: "CURSO", id: "Curso" },
        { nome: "DISCIPLINA", id: "Disciplina" },
        { nome: "DISCIPLINA GRADE", id: "DisciplinaGrade" },
        { nome: "DOCENTE", id: "Docente" },
        { nome: "DOCENTE PERFIL", id: "DocentePerfil" },
        { nome: "GRADE", id: "Grade" },
        { nome: "PEDIDO", id: "Pedido" },
        { nome: "PEDIDO EXTERNO", id: "PedidoExterno" },
        { nome: "PERFIL", id: "Perfil" },
        { nome: "PLANO", id: "Plano" },
        { nome: "SALA", id: "Sala" },
        { nome: "TURMA", id: "Turma" },
        { nome: "TURMA EXTERNA", id: "TurmaExterna" },
      ];
    },
  },
};
</script>
